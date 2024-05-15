const { SerialPort } = require("serialport");
const ModbusRTU = require("modbus-serial");
const { ReadlineParser } = require('@serialport/parser-readline');
//const portName = "/dev/pts/4"; // Altere conforme sua porta serial /dev/ttyUSB0"
const portName = "/dev/ttyUSB0"; // Altere conforme sua porta serial /dev/ttyUSB0"

let serialPort;
let parser;

// Verifique se o arquivo lines existe e é válido
let lines;
let lines16
try {
  lines = require('../src/file');
  lines16 = require('../src/file_16lines')
} catch (err) {
  console.error(`Erro ao carregar o arquivo lines: ${err.message}`);
  process.exit(1); // Encerrar o processo em caso de erro
}

// Função para abrir a porta serial
function openSerialPort() {
  return new Promise((resolve, reject) => {
    serialPort = new SerialPort({
      path: portName,
      baudRate: 57600,
      parity: "none",
      dataBits: 8,
      stopBits: 1
    }, (err) => {
      if (err) {
        return reject(`Erro ao abrir a porta serial: ${err.message}`);
      }
      console.log("Porta serial aberta com sucesso");
      parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n\r' }));
      resolve();
    });
  });
}

// Função para fechar a porta serial
function closeSerialPort() {
  return new Promise((resolve, reject) => {
    if (serialPort && serialPort.isOpen) {
      serialPort.close((err) => {
        if (err) {
          return reject(`Erro ao fechar a porta serial: ${err.message}`);
        }
        console.log("Porta serial fechada com sucesso");
        resolve();
      });
    } else {
      resolve();
    }
  });
}



async function workMethod(stateInfo) {
  const array = stateInfo;

  const line = array[0];
  const sucesso = array[1];
  const erro = array[2];

  erro.reset();
  sucesso.reset();

  const linearray = line.split('\n');
  
  for (let i = 0; i < linearray.length; ++i) {
      const tt = linearray[i];
      if (tt.length > 10) {
          const address = linearray[i].substring(3, 4);
          const num = parseInt(address, 16);

          await sendStrToSerialCom(linearray[i]);
          await wait(50);
         
      }

      if ((i + 1) % 16 === 0 && tt.length === linearray[1].length) { //
          let response = '';
          //response = await readFromSerial();
          console.log("entrei")
          /*while (!response.includes('.')) {
              erro.reset();
              try {
                  response = await readFromSerial();
                  console.log(`Resposta da porta serial: ${response}`);
                  if (!response.includes('.')) {
                      if (!await erro.waitOne(1000)) {
                          throw new Error('Timeout waiting for serial response');
                      }
                  }
              } catch (e) {
                  erro.set();
                  console.error(`Erro ao esperar resposta da porta serial: ${e.message}`);
                  return;
              }
          }*/
          //await wait(50);
          console.log("sai")
      }
  }

  sucesso.set();
  console.log("Processo concluído com sucesso.");
}

function sendStrToSerialCom(str) {
  return new Promise(async(resolve, reject) => {
    let msg = str+"\r"
    serialPort.write(msg, (err) => {
          if (err) {
              console.error(`Erro ao escrever na porta serial: ${msg}`);
              reject(err);
          } else {
              console.log(`Escrito na porta serial: ${msg}`);
              resolve();
          }
      });
      await wait(10)
  });
}

function readFromSerial() {
  return new Promise((resolve, reject) => {
      parser.once('data', (data) => {
          console.log(`Lido da porta serial: ${data}`);
          resolve(data);
      });

      setTimeout(() => {
          reject(new Error('Timeout reading from serial port'));
      }, 1000);  // Timeout de 1 segundo para ler
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const AutoResetEvent = () => {
  let isSet = false;

  return {
      set: () => { isSet = true; },
      reset: () => { isSet = false; },
      waitOne: (timeout) => new Promise((resolve) => {
          const start = Date.now();
          const check = () => {
              if (isSet) resolve(true);
              else if (Date.now() - start >= timeout) resolve(false);
              else setTimeout(check, 50);
          };
          check();
      }),
  };
};



const enviaModbus = async (comand, address, register, value) => {
  // Implemente a função enviaModbus aqui
  comand.setID(1);
  await comand.writeRegister(416, 1);
  console.log("Comando reset enviado");
};

const abrirConexaoModbus = async () => {
  const modbusClient = new ModbusRTU();
  //const port = "/dev/pts/4"; // Altere conforme sua porta serial
  const port = "/dev/ttyUSB0"
  await modbusClient.connectRTU(port, { baudRate: 9600, parity: "none", dataBits: 8, stopBits: 1 });
  return modbusClient;
};

const aguardarRespostaSerial = (serialPort, response, timeout) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      serialPort.removeAllListeners("data");
      reject(new Error("Tempo de espera excedido"));
    }, timeout);

    serialPort.on("data", (data) => {
      const receivedData = data.toString();
     // console.log(data.toString());
    
      if (receivedData.includes(response)) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
};


async function ReadSerial(include){
  try {
    response = await readFromSerial();
    console.log(`Resposta da porta serial: ${response}`);
    if (!response.includes(include)) {
        if (!await erro.waitOne(1000)) {
            throw new Error('Timeout waiting for serial response');
        }
    }
} catch (e) {
    
    console.error(`Erro ao esperar resposta da porta serial: ${e.message}`);
    return;
}
}


async function atualizaFirmware () {
  
    try {
      // Abrir a conexão Modbus
      const modbusClient = await abrirConexaoModbus();

      // Envio do comando de reset via Modbus
      await enviaModbus(modbusClient, 0, 416, 1); // Comando Reset

      // Fechar a conexão Modbus
      await modbusClient.close();

      // Abrir a conexão serial
      await openSerialPort();

      console.log("Aguardando resposta 'BL2.0' da porta serial...");
      await aguardarRespostaSerial(serialPort, 'BL2.0', 10000);
      //ReadSerial("BL2.0")
      console.log("Resposta 'BL2.0' recebida. Enviando comando '#'");
      await sendStrToSerialCom('#');
      console.log("Aguardando resposta 'Recebendo arquivo...' da porta serial...");
      await aguardarRespostaSerial(serialPort, 'Recebendo arquivo...', 10000);
      //ReadSerial("Recebendo arquivo...'")

      console.log("Resposta 'Recebendo arquivo...' recebida. Enviando dados.");
      await wait(1000)
        // Envie os dados aqui
      const sucesso = AutoResetEvent();
      const erro = AutoResetEvent();
      const stateInfo = [
         lines,  // Exemplo de string de entrada
            sucesso,
            erro
        ];

        await workMethod(stateInfo);

    } catch (error) {
      console.error(`Erro durante a atualização de firmware: ${error.message}`);
    } 
 
};

// Exemplo de chamada da função de atualização de firmware
atualizaFirmware()
