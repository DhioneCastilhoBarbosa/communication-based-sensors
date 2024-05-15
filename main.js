
const portName = '/dev/ttyUSB1'
const {SerialPort} = require('serialport');
const {ReadlineParser} = require('@serialport/parser-readline');
const port = new SerialPort({
  path: portName,
  baudRate:1200,
  dataBits: 7,
  parity: 'even',
  stopBits: 1,
  
}); 

port.on('open', () => {
  console.log('Porta serial aberta.');


// Envie um sinal de break state
port.set({ brk: true }, (err) => {
  if (err) {
    console.error('Erro ao enviar o sinal de break:', err.message);
  } else {
    console.log('Sinal de break enviado com sucesso');

    setTimeout(() => {
      
      port.set({brk: false},(err)=>{
        if (err) {
          console.error('Erro ao desligar o breakState:', err);
        } else {
          console.log('breakState desligado com sucesso.');

          setTimeout(() => {
            
          port.write('0D0!', (err) => {
            if (err) {
              console.error('Erro ao enviar o comando:', err);
            } else {
              console.log('Comando enviado com sucesso.');

              // Configurar um parser de leitura
              const parser = port.pipe(new ReadlineParser({delimiter: '\r\n'}));

              // Lidar com a resposta da porta serial
              parser.on('data', (data) => {
                console.log('Resposta da porta serial:', data);
                
                // Feche a porta serial
                port.close((err) => {
                  if (err) {
                    console.error('Erro ao fechar a porta serial:', err);
                  } else {
                    console.log('Porta serial fechada com sucesso.');
                  }
                });
              });
            }
          });
        }, 8);
        }
      })

    }, 13);
  }
})
})

