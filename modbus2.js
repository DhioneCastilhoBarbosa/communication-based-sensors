/* eslint-disable no-console, spaced-comment, func-call-spacing, no-spaced-func */

//==============================================================
// This is an example of polling (reading) Holding Registers
// on a regular scan interval with timeouts enabled.
// For robust behaviour, the next action is not activated
// until the previous action is completed (callback served).
//==============================================================

"use strict";

//==============================================================
// create an empty modbus client
const ModbusRTU   = require ("modbus-serial");
const client      = new ModbusRTU();

let mbsStatus   = "Initializing...";    // holds a status of Modbus

// Modbus 'state' constants
const MBS_STATE_INIT          = "State init";
const MBS_STATE_IDLE          = "State idle";
const MBS_STATE_NEXT          = "State next";
const MBS_STATE_GOOD_READ     = "State good (read)";
const MBS_STATE_FAIL_READ     = "State fail (read)";
const MBS_STATE_GOOD_CONNECT  = "State good (port)";
const MBS_STATE_FAIL_CONNECT  = "State fail (port)";

// Modbus configuration values
const mbsId       = 1;
const mbsScan     = 1000;
const mbsTimeout  = 5000;
let mbsState    = MBS_STATE_INIT;

// Upon SerialPort error
client.on("error", function(error) {
    console.log("SerialPort Error: ", error);
});


//==============================================================
const connectClient = function()
{
    // set requests parameters
    client.setID      (mbsId);
    client.setTimeout (mbsTimeout);

    // try to connect
    client.connectRTUBuffered ("/dev/ttyUSB0", { baudRate: 9600, parity: "One", dataBits: 8, stopBits: 1 })
        .then(function()
        {
            mbsState  = MBS_STATE_GOOD_CONNECT;
            mbsStatus = "Connected, wait for reading...";
            console.log(mbsStatus);
        })
        .catch(function(e)
        {
            mbsState  = MBS_STATE_FAIL_CONNECT;
            mbsStatus = e.message;
            console.log(e);
        });
};


//==============================================================
const readModbusData = function()
{
    // try to read data
    const decoder = new TextDecoder('ascii');
    client.readHoldingRegisters (368, 2)
        .then(function(data)
        {
            mbsState   = MBS_STATE_GOOD_READ;
            mbsStatus  = "success";
            console.log( data.buffer);
            
            let Data = data.buffer
            let asciiData = '';
           
            // Convert each byte to ASCII character
            for (let i = 0; i < Data.length; i++) {
                asciiData += String.fromCharCode(Data[i]);
            }

            let buffer = data.buffer; // Supondo que data.buffer seja um buffer de 4 bytes
            let floatValue = buffer.readFloatLE(0); // Converte o buffer em um float de 32 bits em little-endian
            console.log("Valor:", floatValue);
            
            //console.log('valor convertido:',data.buffer.readInt16BE());


            
        })
        .catch(function(e)
        {
            mbsState  = MBS_STATE_FAIL_READ;
            mbsStatus = e.message;
            //console.log(e);
        });
};


//==============================================================
const runModbus = function()
{
    let nextAction;

    switch (mbsState)
    {
        case MBS_STATE_INIT:
            nextAction = connectClient;
            break;

        case MBS_STATE_NEXT:
            nextAction = readModbusData;
            break;

        case MBS_STATE_GOOD_CONNECT:
            nextAction = readModbusData;
            break;

        case MBS_STATE_FAIL_CONNECT:
            nextAction = connectClient;
            break;

        case MBS_STATE_GOOD_READ:
            nextAction = readModbusData;
            break;

        case MBS_STATE_FAIL_READ:
            if (client.isOpen)  { mbsState = MBS_STATE_NEXT;  }
            else                { nextAction = connectClient; }
            break;

        default:
            // nothing to do, keep scanning until actionable case
    }

    console.log();
    console.log(nextAction);

    // execute "next action" function if defined
    if (nextAction !== undefined)
    {
        nextAction();
        mbsState = MBS_STATE_IDLE;
    }

    // set for next run
    setTimeout (runModbus, mbsScan);
};

//==============================================================

const write = function(){
    client.writeRegisters(416, [1])
        .then(read);
}

runModbus();

//enviamodbus((byte)0x00, (byte)0x06, 416, 1, false); // Comando Reset