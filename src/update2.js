let lines;
try {
  lines = require('../src/file');
} catch (err) {
  console.error(`Erro ao carregar o arquivo lines: ${err.message}`);
  process.exit(1); // Encerrar o processo em caso de erro
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
      const tt = linearray[i].split('');
      if (tt.length > 10) {
          const address = linearray[i].substring(3, 7);
          const num = parseInt(address, 16);

          await sendStrToSerialCom(linearray[i]);
      }

      if ((i + 1) % 16 === 0 && tt.length === linearray[1].split('').length) {
          let response = '';
          while (!response.includes('.')) {
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
          }
          await wait(50);
      }
  }

  sucesso.set();
  console.log("Processo concluído com sucesso.");
}

function sendStrToSerialCom(str) {
  return new Promise((resolve, reject) => {
      serialPort.write(str, (err) => {
          if (err) {
              console.error(`Erro ao escrever na porta serial: ${err}`);
              reject(err);
          } else {
              //console.log(`Escrito na porta serial: ${str}`);
              resolve();
          }
      });
  });
}

function readFromSerial() {
  return new Promise((resolve, reject) => {
      serialPort.read((err, data) => {
          if (err) {
              console.error(`Erro ao ler da porta serial: ${err}`);
              reject(err);
          } else {
              //console.log(`Lido da porta serial: ${data}`);
              resolve(data.toString());
          }
      });
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

// Exemplos de uso (esses devem ser adaptados para o seu ambiente específico):
const serialPort = {
  write: (str, callback) => {
      // Simula a escrita para a porta serial
      console.log(str);
      callback(null);  // Sucesso
  },
  read: (callback) => {
      // Simula a leitura da porta serial
      setTimeout(() => {
          //console.log("Simulando leitura da porta serial");
          callback(null, '.');  // Resposta simulada
      }, 100);  // Simula uma pequena latência
  }
};

// Exemplo de uso da função
const sucesso = AutoResetEvent();
const erro = AutoResetEvent();

const stateInfo = [
  lines,  // Exemplo de string de entrada
  sucesso,
  erro
];

workMethod(stateInfo).catch((err) => {
  console.log("Erro no processo:", err);
});
