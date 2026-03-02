; Simple Hello World - ARM Emulator Test
; This is a minimal test program

start   MOV r0, #0
        ADD r0, r15, hello
        B print

done    HLT

; Print subroutine
print           LDR r2, tx_fifo
                MOV r3, #0
print_loop      ADD r3, r3, #4
                LDR r1, r0
                CMP r1, #0
                BEQ done
                STR r1, r2
                ADD r0, r0, #4
                B print_loop

; Data section
hello   "Hello from ARM!\n"
tx_fifo 0xF0000000
