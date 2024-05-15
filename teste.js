// Função para calcular o CRC16-CCITT
function calculateCRC(data) {
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; ++i) {
      crc ^= data[i] << 8;

      for (let j = 0; j < 8; ++j) {
          crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
  }

  return crc & 0xFFFF;
}

// Função para formatar um byte para dois caracteres hexadecimais
function byteToHex(byte) {
  return byte.toString(16).padStart(2, '0');
}

// Endereco = 1, Método = 0x03, MemAddress = 256, Data = 8
const Endereco = 1;
const Metodo = 0x03;
const MemAddress = 256;
const Data = 8;

// Calcula o CRC dos dados
const data = [Endereco, Metodo, MemAddress >> 8, MemAddress & 0xFF, Data];
const crc = calculateCRC(data);

// Formata os valores para hexadecimal
const hexEndereco = byteToHex(Endereco);
const hexMetodo = byteToHex(Metodo);
const hexMemAddress = byteToHex(MemAddress >> 8) + byteToHex(MemAddress & 0xFF);
const hexData = byteToHex(Data);
const hexCRC = byteToHex(crc >> 8) + byteToHex(crc & 0xFF);

// Monta a string para enviar via terminal Hercules
const stringToSend = `${hexEndereco} ${hexMetodo} ${hexMemAddress} ${hexData} ${hexCRC}`;
console.log('String para enviar via terminal Hercules:', stringToSend);
