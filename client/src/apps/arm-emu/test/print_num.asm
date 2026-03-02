; Hex Number Printer - Emma Power - October 22, 2025
; Takes in a number stored in variable num and prints it to UART as it's hex value
; Emulator Updates made for this to work
; - Barrel Shifter Added
; - Fixed Loop offset Error
; - Added all CMP flags
; - Added BNE and BHS for branchinf
; - CMP fixed to support register values

; Start of Program
start   LDR r0, num     ; Load HEX Number
        LDR r1, mask    ; Load bitmask
        LDR r4, tx_fifo ; Load TX_FIFO
        LDR r13, sp_st  ; Set Stack Pointer start
        LDR r5, sp_st   ; Remember original stack pointer
        ADD r5, r5, #4  ; Offset it by 4 so the future loop reads the last char

; Loop over digits and add them to stack
loopa   AND r2, r1, r0  ; Get last 4 bits of r0 using mask in r2
        STR r2, r13     ; Store in stack
        SUB r13, r13, #4        ; Decrement Stack Pointer
        MOV r0, r0, LSR #4      ; Shift r0 right 4 bits
        CMP r0, #0      ; Check if r0 is empty (full number is in stack)
        BNE loopa       ; Loop if not empty
        ADD r13, r13, #4        ; Increment Stack Pointer

; Loop over stack and print their hex representations
loopc   CMP r13, r5     ; See if stack pointer is equal to its start
        BEQ end         ; Branch if stack is empty
        LDR r2, r13     ; Load r2 with number at stack pointer
        ADD r13, r13, #4        ; Increment Stack Pointer
        CMP r2, #10     ; Compare r2 with 10
        BHS letter      ; Branch if r2 >= 10
number  ADD r2, r2, #48 ; Make r2 an Ascii #
        STR r2, r4      ; Store r1 into TX_FIFO (UART_TX)
        B loopc
letter  ADD r2, r2, #55 ; Make r2 an Ascii Letter
        STR r2, r4      ; Store r1 into TX_FIFO (UART_TX)
        B loopc

; End
end     HLT

; Values
num     0xDEADBEEF      ; Hex # to print
mask    0x0000000F      ; 4 Bit mask
sp_st   0x00000100      ; Stack pointer start position
tx_fifo 0xF0000000      ; TX_FIFO = UART controller address
