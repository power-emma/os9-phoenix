import React, { useState, useEffect, useRef } from 'react';
import './ArmEmulator.css';

// ARM Emulator React Component
// Ported from C by Emma Power - 2026

const ArmEmulator = ({ init }) => {
    const [asmCode, setAsmCode] = useState('');
    const [terminal, setTerminal] = useState([]);
    const [registers, setRegisters] = useState(Array(17).fill(0));
    const [memory, setMemory] = useState(new Uint8Array(65536));
    const [currentInstruction, setCurrentInstruction] = useState(null);
    const [currentLine, setCurrentLine] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [instructionCount, setInstructionCount] = useState(0);
    const [compiledCode, setCompiledCode] = useState(null);
    const [debugInfo, setDebugInfo] = useState([]);
    const [speed, setSpeed] = useState(20); // Actual Hz
    const [speedSlider, setSpeedSlider] = useState(20); // Slider position (0-100)
    const [unlimitedSpeed, setUnlimitedSpeed] = useState(false); // Max speed mode
    const [actualSpeed, setActualSpeed] = useState(0); // Measured speed in Hz
    const [pcToLineMap, setPcToLineMap] = useState({});
    const [isPortrait, setIsPortrait] = useState(false);
    
    const intervalRef = useRef(null);
    const codeEditorRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const containerRef = useRef(null);
    const executionStateRef = useRef({
        registers: Array(17).fill(0),
        memory: new Uint8Array(65536),
        pc: 0,
        halted: false,
        terminal: []
    });

    // Utility function to isolate bytes from opcode
    const byteIsolate = (opcode, position, size, offset) => {
        const mask = (1 << size) - 1;
        return (opcode >> ((size * position) + offset)) & mask;
    };

    // Read 32-bit word from memory (little-endian)
    const readWord = (mem, address) => {
        return ((mem[address + 3] << 24) | 
               (mem[address + 2] << 16) |
               (mem[address + 1] << 8) | 
               mem[address]) >>> 0; // Convert to unsigned 32-bit
    };

    // Write 32-bit word to memory (little-endian)
    const writeWord = (mem, address, value) => {
        mem[address] = value & 0xFF;
        mem[address + 1] = (value >> 8) & 0xFF;
        mem[address + 2] = (value >> 16) & 0xFF;
        mem[address + 3] = (value >> 24) & 0xFF;
    };

    // Compiler: Convert label name to address
    const nameToAddress = (name, varNames, varAddresses) => {
        if (!name || name === '') return -1;
        for (let i = 0; i < varNames.length && varNames[i] != null; i++) {
            if (varNames[i] === name) {
                return varAddresses[i];
            }
        }
        return -1;
    };

    // Compile ARM assembly to binary
    const compileCode = (code) => {
        const lines = code.split('\n');
        const varNames = [];
        const varAddresses = [];
        const compiledInstructions = [];
        const pcToLine = {}; // Map PC address to source line number
        let currentLine = 0;
        let nextVarAddress = 0;

        // First pass: Find variables and labels
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            let line = lines[lineIdx];
            
            // Skip blank lines and comments
            if (line.trim() === '' || line.trim().startsWith(';')) {
                continue;
            }

            const tokens = line.split(/[\s,]+/).filter(t => t && !t.startsWith(';'));
            if (tokens.length === 0) continue;

            const firstToken = tokens[0];
            
            // Check if it's a label (lowercase start, ends with optional colon)
            if (firstToken[0] >= 'a' && firstToken[0] <= 'z') {
                const labelName = firstToken.replace(':', '');
                varNames[nextVarAddress] = labelName;
                varAddresses[nextVarAddress] = currentLine * 4;
                console.log(`Label found: ${labelName} at address ${currentLine * 4} (line ${currentLine})`);
                nextVarAddress++;
                
                // Handle string literals
                if (line.includes('"')) {
                    const stringMatch = line.match(/"([^"]*)"/);
                    if (stringMatch) {
                        const str = stringMatch[1];
                        // Process escape sequences
                        let processedStr = str.replace(/\\n/g, '\n')
                                              .replace(/\\t/g, '\t')
                                              .replace(/\\r/g, '\r')
                                              .replace(/\\0/g, '\0');
                        
                        // Each character takes 4 bytes (word)
                        currentLine += processedStr.length + 1; // +1 for null terminator
                        continue;
                    }
                }
                
                // Handle hex constants (data, not code)
                if (tokens.length > 1 && tokens[1].startsWith('0x')) {
                    currentLine++;
                    continue;
                }
                
                // If there's an instruction after the label, it will be counted in next iteration
                if (tokens.length === 1) {
                    // Just a label alone, no instruction
                    continue;
                }
                // Label with instruction - the instruction will count as currentLine
            }
            
            currentLine++;
        }

        // Second pass: Assemble instructions
        currentLine = 0;
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            let line = lines[lineIdx].trim();
            const originalLine = lines[lineIdx];
            
            // Skip blank lines and comments
            if (line === '' || line.startsWith(';')) continue;

            // Remove inline comments
            const commentIdx = line.indexOf(';');
            if (commentIdx !== -1) {
                line = line.substring(0, commentIdx).trim();
            }

            // Split by whitespace and commas, filter out empty strings
            const tokens = line.split(/[\s,]+/).filter(t => t && t.trim() !== '');
            if (tokens.length === 0) continue;
            
            let opcode = 0;
            let operation = tokens[0];
            let operandStartIdx = 1;

            // Check if first token is a label
            if (operation[0] >= 'a' && operation[0] <= 'z') {
                // Map this PC to the source line for labels too
                const pcAddress = currentLine * 4;
                pcToLine[pcAddress] = lineIdx;
                
                if (tokens.length === 1) {
                    // Just a label, no instruction
                    continue;
                }
                
                // Handle string data
                if (originalLine.includes('"')) {
                    const stringMatch = originalLine.match(/"([^"]*)"/);
                    if (stringMatch) {
                        const str = stringMatch[1];
                        let processedStr = str.replace(/\\n/g, '\n')
                                              .replace(/\\t/g, '\t')
                                              .replace(/\\r/g, '\r')
                                              .replace(/\\0/g, '\0');
                        
                        for (let char of processedStr) {
                            compiledInstructions.push(char.charCodeAt(0));
                            currentLine++;
                        }
                        compiledInstructions.push(0); // null terminator
                        currentLine++;
                        continue;
                    }
                }
                
                // Handle hex constants
                if (tokens[1].startsWith('0x')) {
                    opcode = parseInt(tokens[1], 16);
                    compiledInstructions.push(opcode);
                    currentLine++;
                    continue;
                }
                
                // Label with instruction on same line
                operation = tokens[1];
                operandStartIdx = 2;
            } else {
                // Map this PC to the source line
                const pcAddress = currentLine * 4;
                pcToLine[pcAddress] = lineIdx;
            }

            // Parse operands
            const parseOperand = (token, currentLine, isBranch = false) => {
                if (!token) return { value: 0, isReg: false };
                
                token = token.trim();
                
                // Check if it's indirect addressing with square brackets [rN] or [label]
                if (token.startsWith('[') && token.endsWith(']')) {
                    const inner = token.substring(1, token.length - 1).trim();
                    // Check if inner is a register
                    if (inner.match(/^r\d+$/)) {
                        return { value: parseInt(inner.substring(1)), isReg: true, indirect: true };
                    }
                    // Check if it's a label
                    const globalAddress = nameToAddress(inner, varNames, varAddresses);
                    if (globalAddress !== -1) {
                        const relativeAddress = globalAddress - (currentLine * 4);
                        return { value: relativeAddress, isReg: false, indirect: true };
                    }
                    // Otherwise treat as immediate value
                    if (inner.startsWith('0x')) {
                        return { value: parseInt(inner, 16), isReg: false, indirect: true };
                    }
                    return { value: parseInt(inner), isReg: false, indirect: true };
                }
                // Check if it's a valid register (r followed by digits)
                else if (token.match(/^r\d+$/)) {
                    return { value: parseInt(token.substring(1)), isReg: true };
                } else if (token.startsWith('#')) {
                    return { value: parseInt(token.substring(1)), isReg: false };
                } else if (token.startsWith('0x')) {
                    return { value: parseInt(token, 16), isReg: false };
                } else {
                    // It's a label
                    const globalAddress = nameToAddress(token, varNames, varAddresses);
                    console.log(`Looking up label "${token}", found address: ${globalAddress}, isBranch: ${isBranch}`);
                    if (globalAddress !== -1) {
                        if (isBranch) {
                            // For branches: offset in words, accounting for PC being 2 instructions ahead
                            const relativeAddress = (globalAddress - (currentLine * 4) - 8) / 4;
                            console.log(`Branch from PC=${currentLine*4} to ${globalAddress}, offset=${relativeAddress} (calculation: (${globalAddress} - ${currentLine*4} - 8) / 4)`);
                            return { value: relativeAddress, isReg: false };
                        } else {
                            const relativeAddress = globalAddress - (currentLine * 4);
                            return { value: relativeAddress, isReg: false };
                        }
                    }
                    console.log(`Label "${token}" not found, returning 0`);
                    return { value: 0, isReg: false };
                }
            };

            const o1 = tokens[operandStartIdx] ? parseOperand(tokens[operandStartIdx], currentLine, false) : { value: 0, isReg: false };
            const o2 = tokens[operandStartIdx + 1] ? parseOperand(tokens[operandStartIdx + 1], currentLine, false) : { value: 0, isReg: false };
            const o3 = tokens[operandStartIdx + 2] ? parseOperand(tokens[operandStartIdx + 2], currentLine, false) : { value: 0, isReg: false };

            // Check for barrel shifter
            let shift = 0;
            if (tokens[operandStartIdx + 2]) {
                const shiftOp = tokens[operandStartIdx + 2].toUpperCase();
                let shiftType = 0;
                if (shiftOp === 'LSL') shiftType = 0x00;
                else if (shiftOp === 'LSR') shiftType = 0x01;
                else if (shiftOp === 'ASR') shiftType = 0x02;
                else if (shiftOp === 'ROR') shiftType = 0x03;
                
                if (tokens[operandStartIdx + 3] && tokens[operandStartIdx + 3].startsWith('#')) {
                    const shiftAmount = parseInt(tokens[operandStartIdx + 3].substring(1));
                    shift = (shiftType << 5) | (shiftAmount << 7);
                    console.log(`Shift detected: op=${shiftOp}, type=${shiftType}, amount=${shiftAmount}, encoded shift=0x${shift.toString(16)}, tokens=${JSON.stringify(tokens)}`);
                }
            }

            // Encode instruction
            switch (operation.toUpperCase()) {
                case 'AND':
                    opcode = o3.isReg ? 0x12000000 : 0x10000000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'EOR':
                    opcode = o3.isReg ? 0x12200000 : 0x10200000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'SUB':
                    opcode = o3.isReg ? 0x12400000 : 0x10400000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'RSB':
                    opcode = o3.isReg ? 0x12600000 : 0x10600000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'ADD':
                    opcode = o3.isReg ? 0x12800000 : 0x10800000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'ADC':
                    opcode = o3.isReg ? 0x12A00000 : 0x10A00000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'SBC':
                    opcode = o3.isReg ? 0x12C00000 : 0x10C00000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'RSC':
                    opcode = o3.isReg ? 0x12E00000 : 0x10E00000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'TST':
                    opcode = o3.isReg ? 0x13000000 : 0x11000000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'TEQ':
                    opcode = o3.isReg ? 0x13200000 : 0x11200000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'CMP':
                    opcode = !o2.isReg ? 0x13400000 : 0x11400000;
                    opcode += o1.value * 0x10000 + o2.value;
                    break;
                case 'CMN':
                    opcode = o3.isReg ? 0x13600000 : 0x11600000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'ORR':
                    opcode = o3.isReg ? 0x13800000 : 0x11800000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'MOV':
                    opcode = o2.isReg ? 0x13A00000 : 0x11A00000;
                    opcode += o1.value * 0x1000 + o2.value + shift;
                    if (shift > 0) {
                        console.log(`MOV with shift at line ${lineIdx}: o1=${o1.value}, o2=${o2.value}, shift=0x${shift.toString(16)}, final opcode=0x${(opcode >>> 0).toString(16)}, tokens=${JSON.stringify(tokens)}`);
                    }
                    break;
                case 'BIC':
                    opcode = o3.isReg ? 0x13C00000 : 0x11C00000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'MVN':
                    opcode = o3.isReg ? 0x13E00000 : 0x11E00000;
                    opcode += o2.value * 0x10000 + o1.value * 0x1000 + o3.value;
                    break;
                case 'LDR':
                    // [rN] uses register indirect (immBit=0), [label] or label uses PC-relative (immBit=1)
                    opcode = (o2.isReg && o2.indirect) ? 0x15D00000 : 0x17D00000;
                    opcode += o1.value * 0x1000 + o2.value;
                    break;
                case 'STR':
                    // [rN] uses register indirect (immBit=1), [label] should not be used for STR
                    opcode = (o2.isReg && o2.indirect) ? 0x17E00000 : 0x15E00000;
                    opcode += o1.value * 0x1000 + o2.value;
                    break;
                case 'HLT':
                    opcode = 0xD4400000;
                    break;
                case 'B': {
                    const branchOffset = parseOperand(tokens[operandStartIdx], currentLine, true);
                    opcode = 0xEA000000;
                    opcode |= (branchOffset.value & 0xFFFFFF);
                    console.log(`Compiling B at line ${lineIdx}, PC=${currentLine*4}, tokens=${JSON.stringify(tokens)}, operandStartIdx=${operandStartIdx}, target=${tokens[operandStartIdx]}, offset=${branchOffset.value}, opcode=0x${opcode.toString(16)}`);
                    break;
                }
                case 'BEQ': {
                    const branchOffset = parseOperand(tokens[operandStartIdx], currentLine, true);
                    opcode = 0x0A000000;
                    opcode |= (branchOffset.value & 0xFFFFFF);
                    console.log(`Compiling BEQ at line ${lineIdx}, PC=${currentLine*4}, target=${tokens[operandStartIdx]}, offset=${branchOffset.value}`);
                    break;
                }
                case 'BNE': {
                    const branchOffset = parseOperand(tokens[operandStartIdx], currentLine, true);
                    opcode = 0x1A000000;
                    opcode |= (branchOffset.value & 0xFFFFFF);
                    console.log(`Compiling BNE at line ${lineIdx}, PC=${currentLine*4}, target=${tokens[operandStartIdx]}, offset=${branchOffset.value}`);
                    break;
                }
                case 'BHS': {
                    const branchOffset = parseOperand(tokens[operandStartIdx], currentLine, true);
                    opcode = 0x2A000000;
                    opcode |= (branchOffset.value & 0xFFFFFF);
                    break;
                }
                case 'BLO': {
                    const branchOffset = parseOperand(tokens[operandStartIdx], currentLine, true);
                    opcode = 0x3A000000;
                    opcode |= (branchOffset.value & 0xFFFFFF);
                    break;
                }
                default:
                    console.warn('Unknown operation:', operation);
                    currentLine++;
                    continue;
            }

            compiledInstructions.push(opcode);
            currentLine++;
        }

        return { instructions: compiledInstructions, pcToLine };
    };

    // Load compiled code into memory
    const loadIntoMemory = (compiled) => {
        const newMemory = new Uint8Array(65536);
        let address = 0;
        
        for (let instruction of compiled) {
            writeWord(newMemory, address, instruction);
            if (address === 72) {
                console.log(`Writing to PC=72: instruction=0x${(instruction >>> 0).toString(16)}`);
                const readBack = readWord(newMemory, address);
                console.log(`Read back from PC=72: instruction=0x${readBack.toString(16)}`);
            }
            address += 4;
        }
        
        return newMemory;
    };

    // Execute one instruction
    const executeInstruction = (state) => {
        const { registers: regs, memory: mem } = state;
        const pc = regs[15];
        
        if (pc >= 65536 || state.halted) {
            state.halted = true;
            return;
        }

        const instruction = readWord(mem, pc);
        console.log(`Executing at PC=${pc}: instruction=0x${(instruction >>> 0).toString(16).padStart(8, '0')}`);
        
        // HLT instruction
        if (instruction === 0xD4400000) {
            state.halted = true;
            return;
        }

        let debugMsg = `PC:${(pc/4).toString().padStart(3, '0')} [0x${instruction.toString(16).padStart(8, '0').toUpperCase()}] `;

        // Data Processing Instruction (bits 27-26 = 00 or 01, bit 25 varies)
        if ((instruction & 0x0C000000) === 0x00000000) {
            const opcode = byteIsolate(instruction, 5, 4, 1);
            const operand1 = byteIsolate(instruction, 4, 4, 0);
            const operand2 = byteIsolate(instruction, 0, 12, 0);
            const destination = byteIsolate(instruction, 3, 4, 0);
            const immBit = (instruction >> 25) & 1;

            const opcodeNames = ['AND', 'EOR', 'SUB', 'RSB', 'ADD', 'ADC', 'SBC', 'RSC',
                               'TST', 'TEQ', 'CMP', 'CMN', 'ORR', 'MOV', 'BIC', 'MVN'];
            debugMsg += `${opcodeNames[opcode]} `;

            switch (opcode) {
                case 0: // AND
                    regs[destination] = immBit ? regs[operand1] & regs[operand2] : regs[operand1] & operand2;
                    break;
                case 1: // EOR
                    regs[destination] = immBit ? regs[operand1] ^ regs[operand2] : regs[operand1] ^ operand2;
                    break;
                case 2: // SUB
                    regs[destination] = immBit ? regs[operand1] - regs[operand2] : regs[operand1] - operand2;
                    break;
                case 3: // RSB
                    regs[destination] = immBit ? regs[operand2] - regs[operand1] : operand2 - regs[operand1];
                    break;
                case 4: // ADD
                    regs[destination] = immBit ? regs[operand1] + regs[operand2] : regs[operand1] + operand2;
                    break;
                case 5: // ADC
                    regs[destination] = immBit ? regs[operand1] + regs[operand2] : regs[operand1] + operand2;
                    break;
                case 6: // SBC
                    regs[destination] = immBit ? regs[operand1] - regs[operand2] : regs[operand1] - operand2;
                    break;
                case 7: // RSC
                    regs[destination] = immBit ? regs[operand2] - regs[operand1] : operand2 - regs[operand1];
                    break;
                case 8: // TST
                    break;
                case 9: // TEQ
                    break;
                case 10: // CMP
                    const cmpResult = immBit ? regs[operand1] - operand2 : regs[operand1] - regs[operand2];
                    // Z flag
                    if (cmpResult === 0) regs[16] |= 0x40000000;
                    else regs[16] &= 0xBFFFFFFF;
                    // N flag
                    if (cmpResult < 0) regs[16] |= 0x80000000;
                    else regs[16] &= 0x7FFFFFFF;
                    // C flag
                    if (immBit) {
                        if (regs[operand1] >= operand2) regs[16] |= 0x20000000;
                        else regs[16] &= 0xDFFFFFFF;
                    } else {
                        if (regs[operand1] >= regs[operand2]) regs[16] |= 0x20000000;
                        else regs[16] &= 0xDFFFFFFF;
                    }
                    break;
                case 11: // CMN
                    break;
                case 12: // ORR
                    regs[destination] = immBit ? regs[operand1] | regs[operand2] : regs[operand1] | operand2;
                    break;
                case 13: // MOV
                    regs[destination] = immBit ? regs[operand2 % 16] : operand2;
                    break;
                case 14: // BIC
                    regs[destination] = immBit ? regs[operand1] & ~regs[operand2] : regs[operand1] & ~operand2;
                    break;
                case 15: // MVN
                    regs[destination] = immBit ? ~regs[operand2] : ~operand2;
                    break;
            }

            // Handle shifts (only for register operands, not immediates)
            const shiftType = byteIsolate(instruction, 0, 2, 5);
            const shiftAmount = byteIsolate(instruction, 0, 5, 7);
            
            if (shiftAmount > 0 && immBit === 1) {
                console.log(`Applying shift: type=${shiftType}, amount=${shiftAmount}, destination=r${destination}, before=${regs[destination].toString(16)}`);
                switch (shiftType) {
                    case 0: // LSL
                        regs[destination] = regs[destination] << shiftAmount;
                        break;
                    case 1: // LSR
                        regs[destination] = regs[destination] >>> shiftAmount;
                        break;
                    case 2: // ASR
                        regs[destination] = regs[destination] >> shiftAmount;
                        break;
                    case 3: // ROR
                        regs[destination] = (regs[destination] >>> shiftAmount) | (regs[destination] << (32 - shiftAmount));
                        break;
                }
                console.log(`After shift: ${regs[destination].toString(16)}`);
            }
        }
        // Load/Store Instruction
        else if ((instruction & 0x0C000000) === 0x04000000) {
            const loadBit = (instruction >> 20) & 1;
            const immBit = (instruction >> 25) & 1;
            let offset = byteIsolate(instruction, 0, 12, 0);
            const destination = byteIsolate(instruction, 3, 4, 0);

            debugMsg += loadBit ? 'LDR ' : 'STR ';

            if (loadBit) {
                // Load
                if (!immBit) {
                    offset = readWord(mem, regs[offset]);
                } else {
                    offset = readWord(mem, regs[15] + offset);
                }
                regs[destination] = offset;
            } else {
                // Store
                const address = (regs[offset] >>> 0); // Convert to unsigned
                if (address >= 0xF0000000) {
                    // UART TX_FIFO
                    if (address === 0xF0000000) {
                        const char = String.fromCharCode(regs[destination] & 0xFF);
                        state.terminal.push(char);
                    }
                } else {
                    writeWord(mem, address, regs[destination]);
                }
            }
        }
        // Branch Instruction
        else if ((instruction & 0x0E000000) === 0x0A000000) {
            const type = byteIsolate(instruction, 7, 4, 0);
            let offset = (instruction << 8) >> 8; // Sign extend 24-bit
            // offset is in words, convert to bytes
            offset = offset * 4;
            
            debugMsg += 'BRANCH ';

            let shouldBranch = false;
            switch (type) {
                case 0x0: // BEQ
                    shouldBranch = (regs[16] & 0x40000000) !== 0;
                    debugMsg += 'EQ ';
                    break;
                case 0x1: // BNE
                    shouldBranch = (regs[16] & 0x40000000) === 0;
                    debugMsg += 'NE ';
                    break;
                case 0x2: // BHS
                    shouldBranch = (regs[16] & 0x20000000) !== 0;
                    debugMsg += 'HS ';
                    break;
                case 0x3: // BLO
                    shouldBranch = (regs[16] & 0x20000000) === 0;
                    debugMsg += 'LO ';
                    break;
                case 0xE: // B (unconditional)
                    shouldBranch = true;
                    debugMsg += 'UNCOND ';
                    break;
            }

            if (shouldBranch) {
                // PC is currently at this instruction
                // ARM convention: branch offset is relative to PC+8 (pipeline)
                // But we handle this in compilation, so just apply the offset
                const targetPC = regs[15] + offset + 8;
                regs[15] = targetPC - 4; // -4 because we increment by 4 at the end
                debugMsg += `taken to ${regs[15] + 4}`;
            } else {
                debugMsg += 'not taken';
            }
        }

        // Increment PC
        regs[15] += 4;
        
        return debugMsg;
    };

    // Compile button handler
    const handleCompile = () => {
        try {
            const compiled = compileCode(asmCode);
            setCompiledCode(compiled.instructions);
            setPcToLineMap(compiled.pcToLine);
            setTerminal([]);
            setDebugInfo([`Compiled ${compiled.instructions.length} instructions`]);
            console.log(`Instruction at index 18 (PC=72): 0x${(compiled.instructions[18] >>> 0).toString(16)}`);
            
            // Reset state
            const newMemory = loadIntoMemory(compiled.instructions);
            const newRegs = Array(17).fill(0);
            
            executionStateRef.current = {
                registers: newRegs,
                memory: newMemory,
                pc: 0,
                halted: false,
                terminal: []
            };
            
            setRegisters([...newRegs]);
            setMemory(newMemory);
            setCurrentInstruction(null);
            setCurrentLine(null);
            setInstructionCount(0);
            setIsRunning(false);
            setIsPaused(false);
        } catch (error) {
            setDebugInfo([`Compilation error: ${error.message}`]);
        }
    };

    // Run/Pause toggle
    const handleRunPause = () => {
        if (!compiledCode) return;
        
        if (isRunning) {
            setIsPaused(!isPaused);
        } else {
            setIsRunning(true);
            setIsPaused(false);
        }
    };

    // Reset execution
    const handleReset = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        if (compiledCode) {
            const newMemory = loadIntoMemory(compiledCode);
            const newRegs = Array(17).fill(0);
            
            executionStateRef.current = {
                registers: newRegs,
                memory: newMemory,
                pc: 0,
                halted: false,
                terminal: []
            };
            
            setRegisters([...newRegs]);
            setMemory(newMemory);
            setTerminal([]);
            setDebugInfo([]);
            setCurrentInstruction(null);
            setCurrentLine(null);
            setInstructionCount(0);
            setIsRunning(false);
            setIsPaused(false);
        }
    };

    // Step one instruction
    const handleStep = () => {
        if (!compiledCode || executionStateRef.current.halted) return;
        
        const pc = executionStateRef.current.registers[15];
        setCurrentInstruction(pc);
        setCurrentLine(pcToLineMap[pc] ?? null);
        
        const debugMsg = executeInstruction(executionStateRef.current);
        
        setRegisters([...executionStateRef.current.registers]);
        setTerminal([...executionStateRef.current.terminal]);
        setInstructionCount(prev => prev + 1);
        
        if (debugMsg) {
            setDebugInfo(prev => [...prev.slice(-20), debugMsg]);
        }
        
        if (executionStateRef.current.halted) {
            setIsRunning(false);
            setDebugInfo(prev => [...prev, 'CPU HALTED']);
        }
    };

    // Execution loop at specified Hz
    useEffect(() => {
        if (isRunning && !isPaused && compiledCode) {
            if (unlimitedSpeed) {
                // Unlimited speed mode - run as fast as possible
                let running = true;
                let totalInstrCount = 0;
                const startTime = performance.now();
                let lastUpdate = startTime;
                let animationFrameId = null;
                
                const runFast = () => {
                    if (!running || executionStateRef.current.halted) {
                        if (executionStateRef.current.halted) {
                            setIsRunning(false);
                            setDebugInfo(prev => [...prev, 'CPU HALTED']);
                            // Final update
                            const pc = executionStateRef.current.registers[15] - 4;
                            setRegisters([...executionStateRef.current.registers]);
                            setTerminal([...executionStateRef.current.terminal]);
                            setCurrentInstruction(pc);
                            setCurrentLine(pcToLineMap[pc] ?? null);
                        }
                        return;
                    }
                    
                    // Execute multiple instructions per frame
                    const batchSize = 1000;
                    for (let i = 0; i < batchSize && !executionStateRef.current.halted && running; i++) {
                        executeInstruction(executionStateRef.current);
                        totalInstrCount++;
                    }
                    
                    const now = performance.now();
                    const elapsed = now - lastUpdate;
                    
                    // Update UI every ~100ms or when halted
                    if (elapsed >= 100 || executionStateRef.current.halted) {
                        const pc = executionStateRef.current.registers[15];
                        setRegisters([...executionStateRef.current.registers]);
                        setTerminal([...executionStateRef.current.terminal]);
                        setInstructionCount(prev => prev + totalInstrCount);
                        setCurrentInstruction(pc);
                        setCurrentLine(pcToLineMap[pc] ?? null);
                        
                        // Calculate actual speed (instructions per second)
                        if (elapsed > 0 && totalInstrCount > 0) {
                            const measuredSpeed = Math.round(totalInstrCount / elapsed * 1000);
                            setActualSpeed(measuredSpeed);
                        }
                        
                        lastUpdate = now;
                        totalInstrCount = 0;
                    }
                    
                    if (running) {
                        animationFrameId = requestAnimationFrame(runFast);
                    }
                };
                
                animationFrameId = requestAnimationFrame(runFast);
                
                return () => {
                    running = false;
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                };
            } else {
                // Normal speed mode with interval
                // For high speeds, execute multiple instructions per tick to avoid setInterval limitations
                const minInterval = 10; // Minimum interval in ms (100Hz tick rate)
                const interval = Math.max(minInterval, 1000 / speed);
                const instructionsPerTick = Math.max(1, Math.round(speed * interval / 1000));
                
                intervalRef.current = setInterval(() => {
                    if (executionStateRef.current.halted) {
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        setDebugInfo(prev => [...prev, 'CPU HALTED']);
                        return;
                    }
                    
                    // Execute multiple instructions if needed for high speeds
                    for (let i = 0; i < instructionsPerTick && !executionStateRef.current.halted; i++) {
                        const debugMsg = executeInstruction(executionStateRef.current);
                        if (debugMsg && i === instructionsPerTick - 1) {
                            setDebugInfo(prev => [...prev.slice(-20), debugMsg]);
                        }
                    }
                    
                    const pc = executionStateRef.current.registers[15];
                    setRegisters([...executionStateRef.current.registers]);
                    setTerminal([...executionStateRef.current.terminal]);
                    setInstructionCount(prev => prev + instructionsPerTick);
                    setCurrentInstruction(pc);
                    setCurrentLine(pcToLineMap[pc] ?? null);
                }, interval);
            }
            
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [isRunning, isPaused, compiledCode, speed, unlimitedSpeed, pcToLineMap]);

    // Load default program
    useEffect(() => {
        const defaultProgram = `; Hex Fibonacci Printer - Emma Power - October 22, 2025
; Start of Program
start   MOV r0, #0          
        ADD r0, r15, intro      ; Load String Pointer into r0
        B print                 ; Print the intro string
resume  LDR r1, [mask]          ; Load mask for hex digit extraction
        LDR r4, [tx_fifo]       ; Load UART address for output
        MOV r8, #1              ; Initialize Fibonacci numbers
        MOV r9, #0              ; R0 Contains n-2, R9 Contains n-1, r10 contains n

fib     LDR r13, sp_st          ; Load 2 copies of the stack pointer (r5 will be used later)
        LDR r5, sp_st           
        ADD r5, r5, #4          ; When we are at this point on the stack, no more digits remain
        ADD r6, r6, #1          ; Increment Fibonacci index counter (Counts how many iterations to do)
        ADD r10, r9, r8         ; Calculate next Fibonacci number
        MOV r8, r9              ; Move n-1 to n-2
        MOV r9, r10             ; Move n to n-1
        MOV r0, r10             ; Move Fibonacci number to r0 for printing

loopa   AND r2, r1, r0          ; Start of digit extraction loop, use the mask to get the last hex digit
        STR r2, [r13]           ; Store the digit on the stack
        SUB r13, r13, #4        ; Move stack pointer down
        MOV r0, r0, LSR #4      ; Shift the Fibonacci number to get the next hex digit in position
        CMP r0, #0              ; If the number has been shifted down to 0, we have no more digits to print
        BNE loopa               ; Else, noop for next digits
        ADD r13, r13, #4        ; Un-Subtract last decrement of stack pointer to point to the last digit

loopc   CMP r13, r5             ; Start of print loop, see if stack pointer is at the end (thus number is done printing)
        BEQ end                 ; If so, end of iteration
        LDR r2, [r13]           ; Load the next digit to print from stack
        ADD r13, r13, #4        ; Move stack pointer up for next digit
        CMP r2, #10             ; See if it is a decimal number (0-9) or a letter (A-F)
        BHS letter              ; Letters must be handled slightly diffrently

number  ADD r2, r2, #48         ; Get Ascii value of number
        STR r2, [r4]            ; Print to UART
        B loopc                 ; Branch back to print next digit

letter  ADD r2, r2, #55         ; Get Ascii value of letter
        STR r2, [r4]            ; Print to UART
        B loopc                 ; Branch back to print next digit

end     MOV r2, #10             ; Get Newline character
        STR r2, [r4]            ; Print Newline after each Fibonacci number
        CMP r6, #20             ; Edit this number to print more or less Fibonacci numbers
        BNE fib                 ; If less than r6, do another iteration, else end program
        HLT

; Text Printing Loop
print           LDR r2, [tx_fifo]   ; Get UART Address
print_loop      LDR r1, [r0]        ; Load in the next character
                CMP r1, #0          ; If it is 0 (null char) then end print
                BEQ print_end       ; Else, print the character and loop for the next one
                STR r1, [r2]        ; Print character to UART
                ADD r0, r0, #4      ; Increment string pointer to next character
                B print_loop        ; Print next character
print_end       B resume            ; Resume Last Execution

intro  "The first 20 fibonacci numbers are:\\n"
mask    0x0000000F
sp_st   0x00000100
tx_fifo 0xF0000000

; For those making their own programs,
; tx_fifo is the UART transmit register. Writing a byte to it will print the corresponding character to the terminal.
; sp_st is the initial stack pointer address.
; The emulator has a default of 64KB of memory, so you can use any address from 0x00000000 to 0x0000FFFF for your code and data.
; Strings are stored as 32 bit words in memory, with a null terminator at the end.

; Implemented instructions are as follows
; Data Processing: AND, EOR, SUB, RSB, ADD, ADC, SBC, RSC, TST, TEQ, CMP, CMN, ORR, MOV, BIC, MVN
; Load/Store: LDR, STR (only with register offset, no immediate or pre/post indexing)
; Branches: B, BEQ, BNE, BHS, BLO
; Other: HLT to stop execution
`;
        
        setAsmCode(defaultProgram);
    }, []);

    // Check for portrait mode based on container dimensions
    useEffect(() => {
        const checkOrientation = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                // Portrait if height > width or width is too narrow
                const portrait = height > width || width <= 900;
                setIsPortrait(portrait);
            }
        };

        checkOrientation();
        
        // Use ResizeObserver to watch container size changes
        const resizeObserver = new ResizeObserver(() => {
            checkOrientation();
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div className="arm-emulator" ref={containerRef}>
            <div className="emu-header">
                <h2>ARM Emulator</h2>
                <div className="controls">
                    <button onClick={handleCompile}>Compile</button>
                    <button onClick={handleRunPause} disabled={!compiledCode}>
                        {isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Run'}
                    </button>
                    <button onClick={handleStep} disabled={!compiledCode || (isRunning && !isPaused)}>Step</button>
                    <button onClick={handleReset} disabled={!compiledCode}>Reset</button>
                    <label>
                        Speed: {unlimitedSpeed ? `MAX (${actualSpeed >= 1000000 ? `${(actualSpeed/1000000).toFixed(1)}MHz` : actualSpeed >= 1000 ? `${(actualSpeed/1000).toFixed(0)}kHz` : `${actualSpeed}Hz`})` : speed >= 1000000 ? '1MHz' : speed >= 1000 ? `${(speed/1000).toFixed(1)}kHz` : `${speed}Hz`}
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={speedSlider} 
                            disabled={unlimitedSpeed}
                            onChange={(e) => {
                                const sliderVal = parseInt(e.target.value);
                                setSpeedSlider(sliderVal);
                                // Exponential scale: 1 Hz to 1 MHz
                                // slider 0 = 1Hz, slider 100 = 1,000,000Hz
                                const actualSpeed = Math.round(Math.pow(10, sliderVal / 20));
                                setSpeed(actualSpeed);
                            }}
                        />
                        <label style={{marginLeft: '10px'}}>
                            <input 
                                type="checkbox" 
                                checked={unlimitedSpeed}
                                onChange={(e) => setUnlimitedSpeed(e.target.checked)}
                            />
                            MAX
                        </label>
                    </label>
                </div>
            </div>
            
            <div className="emu-content" style={isPortrait ? {
                flexDirection: 'column',
                width: '100%',
                height: '100%'
            } : {}}>
                {isPortrait ? (
                    <>
                        {/* Portrait: Terminal first, then code */}
                        <div className="execution-panel" style={{
                            flex: '0 0 50%',
                            width: '100%',
                            borderBottom: '2px solid #999999',
                            borderRight: 'none',
                            maxHeight: '50%',
                            minHeight: 0
                        }}>
                            <div className="terminal-section" style={{
                                flex: '1 1 100%',
                                minHeight: 0,
                                borderBottom: 'none',
                                height: '100%',
                                maxHeight: '100%'
                            }}>
                                <h3>Terminal Output</h3>
                                <div className="terminal" style={{
                                    flex: 1,
                                    minHeight: 0
                                }}>
                                    {terminal.join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div className="code-panel" style={{
                            flex: '0 0 50%',
                            width: '100%',
                            borderRight: 'none',
                            borderTop: 'none',
                            maxHeight: '50%',
                            minHeight: 0
                        }}>
                            <h3>Assembly Code</h3>
                            <div className="code-editor-wrapper">
                                <div ref={lineNumbersRef} className="line-numbers">
                                    {asmCode.split('\n').map((_, idx) => (
                                        <div key={idx} className={`line-number ${currentLine === idx ? 'active-instruction' : ''}`}>{idx + 1}</div>
                                    ))}
                                </div>
                                <textarea
                                    ref={codeEditorRef}
                                    value={asmCode}
                                    onChange={(e) => setAsmCode(e.target.value)}
                                    onScroll={(e) => {
                                        if (lineNumbersRef.current) {
                                            lineNumbersRef.current.scrollTop = e.target.scrollTop;
                                        }
                                    }}
                                    spellCheck={false}
                                    className="code-editor"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Landscape: Code first, then execution panel with all sections */}
                        <div className="code-panel">
                            <h3>Assembly Code</h3>
                            <div className="code-editor-wrapper">
                                <div ref={lineNumbersRef} className="line-numbers">
                                    {asmCode.split('\n').map((_, idx) => (
                                        <div key={idx} className={`line-number ${currentLine === idx ? 'active-instruction' : ''}`}>{idx + 1}</div>
                                    ))}
                                </div>
                                <textarea
                                    ref={codeEditorRef}
                                    value={asmCode}
                                    onChange={(e) => setAsmCode(e.target.value)}
                                    onScroll={(e) => {
                                        if (lineNumbersRef.current) {
                                            lineNumbersRef.current.scrollTop = e.target.scrollTop;
                                        }
                                    }}
                                    spellCheck={false}
                                    className="code-editor"
                                />
                            </div>
                        </div>
                        
                        <div className="execution-panel">
                            <div className="terminal-section">
                                <h3>Terminal Output</h3>
                                <div className="terminal">
                                    {terminal.join('')}
                                </div>
                            </div>
                            
                            <div className="registers-section">
                                <h3>Registers</h3>
                                <div className="registers">
                                    {registers.slice(0, 16).map((val, idx) => (
                                        <div key={idx} className="register">
                                            <span className="reg-name">r{idx}:</span>
                                            <span className="reg-value">0x{(val >>> 0).toString(16).padStart(8, '0')}</span>
                                        </div>
                                    ))}
                                    <div className="register">
                                        <span className="reg-name">PSR:</span>
                                        <span className="reg-value">0x{(registers[16] >>> 0).toString(16).padStart(8, '0')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="debug-section">
                                <h3>Execution ({instructionCount} instructions)</h3>
                                <div className="debug-output">
                                    {debugInfo.map((line, idx) => (
                                        <div key={idx} className="debug-line">{line}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ArmEmulator;
