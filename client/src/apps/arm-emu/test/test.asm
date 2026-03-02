ADD r0, r0, #1      ; Set register 0 to 1
ADD r1, r1, #160  ; Set Register 1 to #160 (0xA0)
LDR r2, [4]         ; Load 0xC into register 2
LDR r3, [4]         ; Load 0xDEADBEEF
STR r3, r2          ; Store 0xDEADBEEF into register 0x(4+C) = 0x10
HLT
0x0000000C          ; Begin data
0xDEADBEEF
