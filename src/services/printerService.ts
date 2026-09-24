/**
 * =========================================================================
 * SERVIÇO DE IMPRESSÃO TÉRMICA VIA WEB BLUETOOTH (GOOGLE CHROME / ANDROID)
 * =========================================================================
 * Responsável por:
 * 1. Detecção da Web Bluetooth API no navegador
 * 2. Busca e pareamento com impressora térmica Bluetooth (Baihuo / POS-58 / MPT-II)
 * 3. Reconexão automática a dispositivos previamente autorizados
 * 4. Monitoramento contínuo de status da conexão GATT
 * 5. Transmissão em blocos de ~100 bytes com intervalo de 20ms
 * 6. Garantia de que nenhuma operação é registrada caso a impressão física falhe
 */

// Declarações de tipos para Web Bluetooth
interface BluetoothCharacteristic {
  uuid: string;
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

interface BluetoothService {
  uuid: string;
  getCharacteristics(): Promise<BluetoothCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothService[]>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: (this: BluetoothDevice, ev: Event) => void): void;
  removeEventListener(type: string, listener: (this: BluetoothDevice, ev: Event) => void): void;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    getAvailability?(): Promise<boolean>;
    getDevices?(): Promise<BluetoothDevice[]>;
    requestDevice(options: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
      filters?: Array<{ name?: string; namePrefix?: string; services?: string[] }>;
    }): Promise<BluetoothDevice>;
  };
}

// Lista de UUIDs de serviços comuns em mini impressoras térmicas ESC/POS
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS-58 / Baihuo
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / Pos
  '0000af30-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb',
];

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface PrinterState {
  status: PrinterStatus;
  deviceName: string | null;
  errorMessage: string | null;
  isBluetoothSupported: boolean;
}

type StateListener = (state: PrinterState) => void;

class PrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writableCharacteristic: BluetoothCharacteristic | null = null;
  private listeners: Set<StateListener> = new Set();

  private state: PrinterState = {
    status: 'disconnected',
    deviceName: null,
    errorMessage: null,
    isBluetoothSupported: false,
  };

  constructor() {
    this.checkBluetoothSupport();
  }

  public checkBluetoothSupport(): boolean {
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithBluetooth) : null;
    const supported = !!(nav && nav.bluetooth);
    this.state.isBluetoothSupported = supported;
    return supported;
  }

  public getState(): PrinterState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<PrinterState>): void {
    this.state = { ...this.state, ...partial };
    const current = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('Erro no listener de estado da impressora', err);
      }
    });
  }

  public isConnected(): boolean {
    return (
      this.state.status === 'connected' &&
      !!this.server &&
      this.server.connected &&
      !!this.writableCharacteristic
    );
  }

  /**
   * Tenta reconectar a um dispositivo previamente autorizado pelo usuário
   */
  public async tryAutoReconnect(): Promise<boolean> {
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithBluetooth) : null;
    if (!nav?.bluetooth?.getDevices) {
      return false;
    }

    try {
      const devices = await nav.bluetooth.getDevices();
      if (devices && devices.length > 0) {
        const candidate = devices[0];
        this.updateState({
          status: 'connecting',
          deviceName: candidate.name || 'Impressora Térmica Conhecida',
          errorMessage: null,
        });
        await this.connectToDevice(candidate);
        return true;
      }
    } catch (err) {
      console.warn('Não foi possível reconectar à impressora anterior:', err);
    }
    return false;
  }

  /**
   * Abre o diálogo nativo do Chrome para o usuário selecionar e autorizar a impressora
   */
  public async requestAndConnect(): Promise<void> {
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithBluetooth) : null;
    if (!nav?.bluetooth) {
      const msg =
        'Web Bluetooth não está disponível neste navegador. Use o Google Chrome no tablet Android.';
      this.updateState({ status: 'error', errorMessage: msg });
      throw new Error(msg);
    }

    this.updateState({ status: 'connecting', errorMessage: null });

    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      await this.connectToDevice(device);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotFoundError') {
        // Usuário cancelou a janela de seleção
        this.updateState({
          status: 'disconnected',
          errorMessage: 'Conexão cancelada pelo usuário.',
        });
        return;
      }
      this.updateState({
        status: 'error',
        errorMessage: error.message || 'Falha ao conectar à impressora Bluetooth.',
      });
      throw err;
    }
  }

  /**
   * Conecta ao servidor GATT e localiza a característica gravável
   */
  private async connectToDevice(device: BluetoothDevice): Promise<void> {
    this.device = device;

    // Escuta evento de desconexão inesperada
    device.addEventListener('gattserverdisconnected', this.handleDisconnect);

    if (!device.gatt) {
      throw new Error('Dispositivo Bluetooth não suporta GATT.');
    }

    this.server = await device.gatt.connect();

    // Varre serviços e características em busca de canal de escrita
    const services = await this.server.getPrimaryServices();
    let foundChar: BluetoothCharacteristic | null = null;

    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            foundChar = c;
            break;
          }
        }
      } catch {
        // Continua buscando no próximo serviço
      }
      if (foundChar) break;
    }

    if (!foundChar) {
      throw new Error('Nenhuma característica gravável foi encontrada na impressora.');
    }

    this.writableCharacteristic = foundChar;

    this.updateState({
      status: 'connected',
      deviceName: device.name || 'Impressora POS-58',
      errorMessage: null,
    });
  }

  private handleDisconnect = (): void => {
    this.writableCharacteristic = null;
    this.server = null;
    this.updateState({
      status: 'disconnected',
      deviceName: null,
      errorMessage: 'A impressora foi desconectada.',
    });
  };

  /**
   * Envia bytes ESC/POS diretamente à impressora em blocos de ~100 bytes com pausa de 20ms
   */
  public async printBytes(bytes: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.writableCharacteristic) {
      throw new Error(
        'Impressora não está conectada. Verifique se a impressora térmica está ligada e conectada.'
      );
    }

    const CHUNK_SIZE = 100;
    const CHUNK_DELAY_MS = 20;

    try {
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        
        if (
          this.writableCharacteristic.writeValueWithoutResponse &&
          this.writableCharacteristic.properties.writeWithoutResponse
        ) {
          await this.writableCharacteristic.writeValueWithoutResponse(chunk);
        } else if (this.writableCharacteristic.writeValueWithResponse) {
          await this.writableCharacteristic.writeValueWithResponse(chunk);
        } else {
          await this.writableCharacteristic.writeValue(chunk);
        }

        if (i + CHUNK_SIZE < bytes.length) {
          await new Promise((res) => setTimeout(res, CHUNK_DELAY_MS));
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      this.handleDisconnect();
      throw new Error(`Erro ao transmitir dados para a impressora: ${error.message || 'Falha de comunicação'}`);
    }
  }

  /**
   * Desconecta manualmente
   */
  public disconnect(): void {
    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
    }
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.handleDisconnect();
  }
}

export const printerService = new PrinterService();
