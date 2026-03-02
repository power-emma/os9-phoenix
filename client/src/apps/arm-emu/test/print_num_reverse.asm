start   LDR r0, num     ; Load HEX Number
        LDR r1, mask    ; Load bitmask
        LDR r4, tx_fifo ; Load TX_FIFO
loopa   MOV r0, #0
        AND r2, r1, r0  ; Now 4 Bit
        CMP r2, #10
        BHS letter
number  ADD r2, r2, #48 ; Ascii #
        STR r2, r4      ; Store r1 into TX_FIFO (UART_TX)
        B loopb
letter  ADD         STR r2, r4      ; Store r1 into TX_FIFO (UART_TX)r2, r2, #55 ; Ascii Letter
        STR r2, r4      ; Store r1 into TX_FIFO (UART_TX)
        B loopb
loopb   MOV r0, r0, LSR #4
        CMP r0, #0
        BNE loopa
        HLT
num     0x075BCD15              ; Hex # to print
mask    0x0000000F              ; 4 Bit mask
tx_fifo 0xF0000000              ; TX_FIFO = 0xF0000000
