; Hex Fibonacci Printer - Emma Power - October 22, 2025
; Start of Program
start   MOV r0, #0
        ADD r0, r15, intro       ; Load r2 with Address of 1st letter of string
        B print
resume  LDR r1, mask    ; Load bitmask
        LDR r4, tx_fifo ; Load TX_FIFO
        MOV r8, #1
        MOV r9, #0

fib     LDR r13, sp_st  ; Set Stack Pointer start
        LDR r5, sp_st   ; Remember original stack pointer
        ADD r5, r5, #4  ; Offset it by 4 so the future loop reads the last char
        ADD r6, r6, #1
        ADD r10, r9, r8
        MOV r8, r9
        MOV r9, r10
        MOV r0, r10

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
       ; Load r2 with number at stack  LDR r2, r13     pointer
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
end     MOV r2, #10
        STR r2, r4      ; Store r1 into TX_FIFO (UART_TX)
        CMP r6, #10
        BNE fib
        HLT

; Print Subroutine
; r0 Must contain the memory address of the first char of the string
print           LDR r2, tx_fifo         ; Load Address of TX_FIFO into register 0
                MOV r3, #0
print_loop      ADD r3, r3, #4          ; Increment r2 and r3    
                LDR r1, r0              ; Load Next Letter (Memory at r2) into r1
                CMP r1, #0              ; Check if null terminator
                BEQ print_end           ; if null halt
                STR r1, r2              ; Store r1 into TX_FIFO (UART_TX)
                ADD r0, r0, #4                        
                B print_loop            ; Else loop to Line 3
print_end       B resume

intro  "The first 10 fibonacci numbers are:\n"
mask    0x0000000F      ; 4 Bit mask
sp_st   0x00000100      ; Stack pointer start position
tx_fifo 0xF0000000      ; TX_FIFO = UART controller address