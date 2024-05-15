const { SerialPort } = require("serialport");
const { ReadlineParser } = require('@serialport/parser-readline');
const portName = '/dev/pts/4'

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
      parser = serialPort.pipe(new ReadlineParser({ delimiter: ' ' }));
      resolve();
    });
  });
}

openSerialPort()

/*serialPort.on('data', function (data) {
    console.log('Dados recebidos: ', JSON.stringify(data));
});*/
