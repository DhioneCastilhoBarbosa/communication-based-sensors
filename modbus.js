
const {SerialPort} = require('serialport')

function enviamodbus(SlaveAddress, method, MemAddress, data, CharArray, timeout_modbus) {
    let frame = [];
    let SlaveAddress_ = [SlaveAddress];
    let method_ = [method];
    let MemAddress_ = new Uint16Array([MemAddress]);
    let data_ = new Uint16Array([data]);

    if (isLittleEndian()) {
        MemAddress_ = swapBytes(MemAddress_);
        data_ = swapBytes(data_);
    }

    frame = frame.concat(SlaveAddress_);
    frame = frame.concat(method_);
    frame = frame.concat(Array.from(new Uint8Array(MemAddress_.buffer)));
    frame = frame.concat(Array.from(new Uint8Array(data_.buffer)));

    frame = frame.concat(MODBUS_CRC(frame));

    return new Promise((resolve, reject) => {
        try {
            const port = new SerialPort({ 
                path: '/dev/ttyUSB0', // substitua '/dev/ttyUSB0' pela porta serial correta
                baudRate: 57600, // configurar a velocidade da porta serial conforme necessário
                autoOpen: false, // evitar a abertura automática da porta
                stopBits:1,
                dataBits:8,
                
            });

            port.open((err) => {
                if (err) {
                    reject(new Error('Erro ao abrir a porta serial: ' + err.message));
                    return;
                }

                const buffer = Buffer.from(frame);
                console.log(buffer)
                port.write(buffer, async (err) => {
                    if (err) {
                        reject(new Error('Erro ao enviar dados pela porta serial: ' + err.message));
                        return;
                    }

                    try {
                        const response = await waitForResponse(port, timeout_modbus);
                        port.close();
                        resolve(response);
                    } catch (error) {
                        port.close();
                        reject(error);
                    }
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

async function waitForResponse(port, timeout) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout de resposta excedido'));
        }, timeout);

        port.on('data', (data) => {
            clearTimeout(timeoutId);
            //console.log(data)
            resolve(data);
        });
    });
}

function MODBUS_CRC(c) {
    let CRC16 = 0xffff;
    let poly = 0xA001;

    for (let x = 0; x < c.length; x++) {
        CRC16 ^= c[x];
        for (let y = 0; y < 8; y++) {
            if (CRC16 & 0x0001) {
                CRC16 >>= 1;
                CRC16 ^= poly;
            } else {
                CRC16 >>= 1;
            }
        }
    }

    let ByteBuffer = new ArrayBuffer(2);
    let BufferDataView = new DataView(ByteBuffer);
    BufferDataView.setUint16(0, CRC16);
    return Array.from(new Uint8Array(ByteBuffer));
}

function isLittleEndian() {
    let buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
}

function swapBytes(array) { 
    let newArray = new Uint8Array(array.length);
    for (let i = 0; i < array.length; i++) {
        newArray[i] = array[array.length - 1 - i];
    }
    return newArray;
}

// Exemplo de uso da função enviamodbus
enviamodbus(0x0000, 0x0003,0x100, 0x0001, true, 6000)
    .then(response => {
        console.log('Resposta recebida:', response);
    })
    .catch(error => {
        console.error('Erro:', error);
    });
