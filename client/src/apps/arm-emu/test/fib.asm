ADD r0, r0, #1  ; Set r0 to 1
ADD r2, r1, r0  ; Start of Loop r2 = r1 + r0 
ADD r0, r1, #0  ; Copy r0 into r1
ADD r1, r2, #0  ; Copy r2 into r1
ADD r12, r2, #0 ; Copy r2 into r12 (r12 = debug print register)
ADD r3, r3, #1  ; Increment r3 (Loop Counter)
CMP r3, #40     ; Compare r3 and 40
BEQ #1          ; If r3 = 40 skip the next line
B #-8           ; Else; Loop back to line 2
HLT
