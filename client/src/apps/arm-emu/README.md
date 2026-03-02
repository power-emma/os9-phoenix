# ARM Emulator React App

A browser-based ARM assembler and emulator with real-time instruction visualization and terminal output.

## Features

- **ARM Assembly Compiler**: Compiles ARM assembly language to binary instructions
- **ARM Emulator**: Executes compiled ARM instructions
- **Terminal Display**: Shows UART output in real-time
- **Instruction Visualization**: Displays each instruction as it executes
- **Adjustable Clock Speed**: Run at 1-100Hz (default 20Hz)
- **Step-by-Step Execution**: Step through instructions one at a time
- **Register Display**: View all 16 general-purpose registers + PSR in real-time
- **Debug Information**: See detailed execution trace

## Usage

### Running the App

1. Write or paste ARM assembly code in the left editor panel
2. Click **Compile** to assemble the code into binary
3. Click **Run** to execute at the selected speed (default 20Hz)
4. Use **Pause/Resume** to control execution
5. Click **Step** to execute one instruction at a time
6. Click **Reset** to restart from the beginning

### Controls

- **Compile**: Assembles the ARM code into executable instructions
- **Run/Pause**: Starts or pauses automatic execution
- **Step**: Executes a single instruction (only when paused)
- **Reset**: Reloads the compiled program and resets all state
- **Speed Slider**: Adjusts execution speed from 1Hz to 100Hz

### Supported Instructions

#### Data Processing
- `AND`, `EOR`, `SUB`, `RSB`, `ADD`, `ADC`, `SBC`, `RSC`
- `TST`, `TEQ`, `CMP`, `CMN`
- `ORR`, `MOV`, `BIC`, `MVN`

#### Load/Store
- `LDR` - Load from memory
- `STR` - Store to memory

#### Branch
- `B` - Unconditional branch
- `BEQ` - Branch if equal
- `BNE` - Branch if not equal
- `BHS` - Branch if higher or same
- `BLO` - Branch if lower

#### Special
- `HLT` - Halt execution

#### Barrel Shifter
- `LSL` - Logical shift left
- `LSR` - Logical shift right
- `ASR` - Arithmetic shift right
- `ROR` - Rotate right

### Assembly Syntax

Labels (lowercase):
```asm
start   MOV r0, #42
loop    ADD r1, r1, #1
        CMP r1, #10
        BNE loop
```

Data definitions:
```asm
message "Hello, World!\n"
mask    0x0000000F
```

Comments:
```asm
; This is a comment
MOV r0, #5  ; Inline comment
```

### UART Output

Store to address `0xF0000000` to output to the terminal:

```asm
LDR r2, tx_fifo
MOV r1, #65      ; ASCII 'A'
STR r1, r2       ; Output to terminal

tx_fifo 0xF0000000
```

### Example Programs

The app comes pre-loaded with a Fibonacci number printer that demonstrates:
- Labels and branches
- String literals
- Stack operations
- Hex number formatting
- UART output

See `fib_uart.asm` in the test folder for the full example.

## Technical Details

### Architecture
- 16 general-purpose registers (r0-r15)
- r15 is the program counter (PC)
- r16 is the program status register (PSR)
- 64KB byte-addressable memory
- Memory-mapped UART at `0xF0000000`

### Memory Map
- `0x00000000-0x0000FFFF`: Program and data memory
- `0xF0000000`: UART TX FIFO (write only)

### Instruction Encoding
Instructions follow standard ARM encoding:
- 32-bit fixed-width instructions
- Condition codes in bits 31-28
- Immediate vs register operands
- Barrel shifter support

## Integration

To use in your OS9 window manager:

```jsx
import ArmEmulator from './apps/arm-emu';

// In your window configuration:
const window = {
    title: "ARM Emulator",
    content: <ArmEmulator init={{ width: 800, height: 600 }} />
};
```

## Credits

Original C implementation by Emma Power - 2025
React port - 2026
