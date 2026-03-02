#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <sys/types.h>

// Arm Compiler
// Emma Power - 2025




int nameToAddress(char* name, char** varNames, int32_t varAddresses[]) {
    if (name == NULL || name[0] == '\0') {
        return -1;
    }
    //printf("in Address varNames[0] = %s\n", varNames[0]);
    for (int i = 0; i < 32 && varNames[i] != NULL; i++) {
        if (strcmp(varNames[i], name) == 0) {
            
            printf("Found variable %s at address %X\n", name, varAddresses[i]);

            return (int) varAddresses[i];

        } else {
            //printf("Not %s and %s \n", varNames[i], name);
        }
    }
    return -1;
}

int main () {
    char file[] = "./test/fib_uart.asm";
    char* file1 = malloc(strlen(file) * sizeof(char));
    strcpy(file1, file);
    char** varNames = (char**) malloc(256*sizeof(char*));

    int32_t* varAddresses = (int32_t*) malloc(256*sizeof(int32_t));   

    FILE *fptr;
    FILE *wptr;


    fptr = fopen(file1, "r");

    if (fptr == NULL) {
        printf("File not found");
        return 1;
    }


    char nextLine[10000] = "";
    int currentLine = 0;
    int nextVarAddress = 0;

    // First Pass (Finding Variables)
    while (fgets(nextLine, 10000, fptr)) {
        // Variables are always lowercase
        // variable definition is always the first entry

        int validWord = 1;
        int stringCount = 0;
        int stringEver = 0;
        int blank = 0;
        char* currentWord = malloc(10000*sizeof(char));
        memset(currentWord,0x00,10000);
        int startAdd = currentLine;
        for (int i = 0; i < strlen(nextLine) && validWord == 1; i++) {

            if (nextLine[i] == ' ' || nextLine[i] == '\n' || nextLine[i] == '\t') {
                if (nextLine[0] == '\n' || nextLine[0] == ';') {
                            printf("Blank Line found\n");
                            // Force For Loop End
                            i = strlen(nextLine);
                            // Dont Count This
                            blank = 1;
                            currentLine --;
                            break;
                } else if (currentWord[0] == ' ' || currentWord[0] == '\0' || currentWord[0] == '\n' || currentWord[0] == '\t') {
                    // Empty word 
                    // validWord = 0;
                } else if (validWord && currentWord[0] >= 'a' && currentWord[0] <= 'z') {
                    varNames[nextVarAddress] = malloc(sizeof(char) * (strlen(currentWord) + 1));
                    varNames[nextVarAddress] = currentWord;
                    varAddresses[nextVarAddress] = currentLine * 4;
                    validWord = 0;
                    printf("Word: %s At address %d in array location %d\n", varNames[nextVarAddress],  varAddresses[nextVarAddress], nextVarAddress);
                    nextVarAddress ++;
                    printf("Strlen = %d\n", strlen(nextLine));
                    for (int j = i; j < strlen(nextLine); j++) {

                        if (nextLine[j] == '\"') {
                            if (stringCount == 1) {
                                currentLine = currentLine + 1;
                                printf("Ended String!, %c\n", nextLine[j]);
                                stringCount = 0;
                            } else {
                                stringCount = 1;
                                stringEver = 1;
                                printf("Started String!, %c\n", nextLine[j]);
                            }
                        }
                        else if (nextLine[j] == '\\') {
                            j = j++;
                            
                        }
                        else if (stringCount) {
                            currentLine ++;
                        } else {
                            //printf("Not a string, breaking, %c\n", nextLine[j]);
                        }
                    }
                    break;
                }
            } else if (nextLine[i] == '\\') {
                i ++;
                
            } else if (nextLine[i] < 'A' || nextLine[i] > 'Z') {
                // Not uppercase = not an instruction
                currentWord[strlen(currentWord)] = nextLine[i];
                if(stringCount) {
                    currentLine ++;
                }
                //printf("Word: %s\n", currentWord);
            } else {
                validWord = 0;
                break;
            }

        }
        if(stringEver) {
            printf("Used %d words of memory\n", currentLine - startAdd);
        } else {
            currentLine = startAdd;
        }
        if (!blank) {
            currentLine ++;
        }
    }
    printf("varNames[0] = %s\n", varNames[0]);
    nameToAddress("", varNames, varAddresses);
    currentLine = 0;
    FILE *fptr2;
    char* file2 = malloc(strlen(file) * sizeof(char));
    strcpy(file2, file);
    
    fptr2 = fopen(file2, "r");
    // Open a file in writing mode
    wptr = fopen(strcat(file, ".bin"), "w");

    // Second Pass (Assembling)
    while (fgets(nextLine, 10000, fptr2)) {
        printf("Next: %s", nextLine);

        char* currentWord = malloc(10000*sizeof(char));
        memset(currentWord,0x00,4000);
        char* operation = (char*) malloc(4*sizeof(char));       
        uint32_t o1 = 0;
        uint32_t o2 = 0;
        uint32_t o3 = 0;
        uint32_t shift = 0;
        // Register vs immediate flags
        char r1 = 0;
        char r2 = 0;
        char r3 = 0;
        uint8_t currentPhase = 0;
        printf("Current Line: %d\n", currentLine);
        
        for (int i = 0; i < strlen(nextLine); i++) {

            if (nextLine[i] == ' ' || nextLine[i] == '\n' || nextLine[i] == '\t' || nextLine[i] == ';'  || nextLine[i] == '\n') {

                switch (currentPhase) {
                    case 0:
                        if (currentWord[0] > 'a' && currentWord[0] < 'z') {
                            // label
                            currentPhase --;
                            break;
                        } else if (nextLine[0] == '\n' || nextLine[0] == ';') {
                            printf("Blank Line found\n");
                            i = strlen(nextLine);
                            currentLine --;
                            break;
                        }
                        else if (currentWord[0] == ' ' || currentWord[0] == '\0' || currentWord[0] == '\t')  {
                            // Empty word 
                            currentPhase --;
                            // printf("Empty Word\n");
                            break;
                        } 

                        printf("Current Woerd: \"%s\"\n", currentWord);
                        for (int j = 0; j < strlen(currentWord); j++) {

                            operation[j] = currentWord[j];
                            
                            //printf("Current Word: \"%d\"\n", currentWord[j]);
                        }
                        //printf("Current Word: \"%s\"\n", operation);
                        break;
                    case 1:
                        if (currentWord[0] == 'r' && currentWord[1] >= '0' && currentWord[1] <= '9') {
                            currentWord[0] = ' ';
                            o1 = atoi(currentWord);
                            r1 = 1;
                        } else if (currentWord[0] == '#') {
                            currentWord[0] = ' ';
                            o1 = atoi(currentWord);
                        } else if (currentWord[0] == '[') {
                            currentWord[strlen(currentWord)-1] = ' ';
                            currentWord[0] = ' ';
                            o1 = atoi(currentWord);
                            r1 = 0;
                        } else if (currentWord[0] == ' ' || currentWord[0] == '\0' || currentWord[0] == '\n' || currentWord[0] == '\t') {
                            // Empty word 
                            currentPhase --;
                            // printf("Empty Word\n");
                            break;
                        } else {
                            int globalAddress = nameToAddress(currentWord, varNames, varAddresses);
                            int relativeAddress = globalAddress - (currentLine * 4);
                            o1 = relativeAddress;
                            r1 = 0;
                            printf("Variable %s at address %X\n", currentWord, relativeAddress);
                        }
                        
                        break;
                    case 2:
                        if (currentWord[0] == 'r') {
                            currentWord[0] = ' ';
                            o2 = atoi(currentWord);
                            r2 = 1;
                        } else if (currentWord[0] == '#') {
                            currentWord[0] = ' ';
                            o2 = atoi(currentWord);
                            r2 = 0;
                        } else if (currentWord[0] == '[') {
                            currentWord[strlen(currentWord)-1] = ' ';
                            currentWord[0] = ' ';
                            o2 = atoi(currentWord);
                            r2 = 0;
                        } else if (currentWord[0] == ' ' || currentWord[0] == '\0' || currentWord[0] == '\n' || currentWord[0] == '\t') {
                            // Empty word 
                            currentPhase --;
                            // printf("Empty Word\n");
                            break;
                        } else {
                            int globalAddress = nameToAddress(currentWord, varNames, varAddresses);
                            int relativeAddress = globalAddress - (currentLine * 4);
                            o2 = relativeAddress;
                            r2 = 0;
                            printf("Variable %s at address %X\n", currentWord, varAddresses[globalAddress]);
                        }
                        break;
                    case 3:
                        if (currentWord[0] == 'r') {
                            currentWord[0] = ' ';
                            o3 = atoi(currentWord);
                            r3 = 1;
                        } else if (currentWord[0] == '#') {
                            if (shift == 0) {
                            currentWord[0] = ' ';
                            o3 = atoi(currentWord);
                            } else {
                                currentWord[0] = ' ';
                                shift += atoi(currentWord) << 3;
                            }
                        } else if (currentWord[0] == '[') {
                            currentWord[strlen(currentWord)-1] = ' ';
                            currentWord[0] = ' ';
                            o3 = atoi(currentWord);
                            r3 = 0;
                        } else if (currentWord[0] == ' ' || currentWord[0] == '\0' || currentWord[0] == '\n' || currentWord[0] == '\t') {
                            // Empty word 
                            // printf("Empty Word\n");
                            break;
                        // Barrel Shifter Operand
                        } else if (currentWord[0] >= 'A' && currentWord[0] <= 'Z') {
                            printf("Barrel Shifter Detected: %s\n", currentWord);
                            // Shift 00
                            if (!strcmp(currentWord, "LSL")) {
                                shift = 0x00;
                            // Shift 01
                            } else if (!strcmp(currentWord, "LSR")) {
                                shift = 0x02;
                            }
                            // Shift 10
                            else if (!strcmp(currentWord, "ASR")) {
                                shift = 0x04;
                            } 
                            else if (!strcmp(currentWord, "CSR")) {
                                shift = 0x06;
                            }


                        }
                        else {
                            int globalAddress = nameToAddress(currentWord, varNames, varAddresses);
                            int relativeAddress = globalAddress - (currentLine * 4);
                            o3 = relativeAddress;
                            r3 = 0;
                            printf("Variable %s at address %X\n", currentWord, varAddresses[globalAddress]);
                        }

                        currentPhase --;
                        break;
                    
                    default:
                        break;
                }

                
                // Clear Word

                memset(currentWord,0x00,32);

                currentPhase ++;

                 
            } else if (nextLine[i] == ',') {

            } else if (nextLine[i] == ';') {
                break;
            } else {
                currentWord[strlen(currentWord)] = nextLine[i];
                //printf("Word: %s\n", currentWord);
            }

            

        }
        currentLine ++;
        //printf("\"%s\"\n", operation);
        printf("Instruction %s and operands %d %d %d :3\n", operation, o1, o2, o3);

        uint32_t opcode;

        if (operation[0] == '\"') {
            printf("Here!\n");
            int start = 0;
            for (int i = 1; nextLine[i] != '\"'; i++) {
                start ++;
            }
            for (int i = start + 2; nextLine[i] != '\"'; i++) {
                if (nextLine[i] == '\\') {
                    switch (nextLine[i + 1]) {
                        case 'a':
                            opcode = '\a';
                            break;
                        case 'b':
                            opcode = '\b';
                            break;
                        case 'f':
                            opcode = '\f';
                            break;
                        case 'n':
                            opcode = '\n';
                            break;
                        case 'r':
                            opcode = '\r';
                            break;
                        case 't':
                            opcode = '\t';
                            break;
                        case 'v':
                            opcode = '\v';
                            break;
                        case '0':
                            opcode = '\0';
                            break;
                        default:
                            opcode = nextLine[i+1];
                            break;
                    }
                    i++;
                } else {
                    opcode = nextLine[i];
                }
                fwrite(&opcode, 4, 1, wptr);

                //printf("wrotes %c to file\n", opcode);
            }
            opcode = '\0';
            fwrite(&opcode, 4, 1, wptr);
            currentLine ++;

        } else if (operation[0] == '0' && operation[1] == 'x') {
            opcode = (uint32_t) strtoul(operation, NULL, 16);
            printf("Opcode: %X\n", opcode);
            
        } 
        // DP 0000
        else if (!strcmp(operation, "AND")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x12000000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x10000000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        }
        // DP 0001
        else if (!strcmp(operation, "EOR")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x12200000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x10200000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        } 
        
        // DP 0010
        else if (!strcmp(operation, "SUB")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x12400000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x10400000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        }
        // DP 0011
        else if (!strcmp(operation, "RSB")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x12600000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x10600000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        } 
        
        // DP 0100
        else if (!strcmp(operation, "ADD")) {
            if (r3) {
                opcode = 0x12800000;
            } else {
                opcode = 0x10800000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        } 
        // DP 0101
        else if (!strcmp(operation, "ADC")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x12A00000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x10A00000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        }
        // DP 0110
        else if (!strcmp(operation, "SBC")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x12C00000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x10C00000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        }
        // DP 0111
        else if (!strcmp(operation, "RSC")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x12E00000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x10E00000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        }
        // DP 1000
        else if (!strcmp(operation, "TST")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13000000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11000000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        }
        // DP 1001
        else if (!strcmp(operation, "TEQ")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13200000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11200000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        }
        // DP 1010
        else if (!strcmp(operation, "CMP")) {
            printf("Immediate Flag for CMP: %d\n", r2);
            if (!r2) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13400000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11400000;
            }
            opcode += o1 * 0x10000;
            opcode += o2;
            printf("Opcode: %X\n", opcode);

        }
        // DP 1011
        else if (!strcmp(operation, "CMN")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13600000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11600000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        } // DP 1100
        else if (!strcmp(operation, "ORR")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13800000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11800000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        } // DP 1101
        else if (!strcmp(operation, "MOV")) {
            if (r2) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13A00000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11A00000;
            }

            opcode += o1 * 0x1000;
            opcode += o2;
            printf("Opcode: %X\n", opcode);

        }
        // DP 1110
        else if (!strcmp(operation, "BIC")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13C00000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11C00000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        } // DP 1111
        else if (!strcmp(operation, "MVN")) {
            if (r3) {
                // 0001 001P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x13E00000;
            } else {
                // 0001 000P PPPS NNNN DDDD 2222 2222 2222
                opcode = 0x11E00000;
            }
            opcode += o2 * 0x10000;
            opcode += o1 * 0x1000;
            opcode += o3;
            printf("Opcode: %X\n", opcode);

        } else if (!strcmp(operation, "LDR")) {
            printf("Immediate Flag for LDR: %d\n", r2);
            if (r2) {
                opcode = 0x15D00000;
            } else {
                opcode = 0x17D00000;
            }
            opcode += o1 * 0x1000;
            opcode += o2 * 0x1;
            printf("Opcode: %X\n", opcode);
        }  else if (!strcmp(operation, "STR")) {
            if (r2) {
                opcode = 0x17E00000;
            } else {
                opcode = 0x15E00000;
            }
            opcode += o1 * 0x1000;
            opcode += o2 * 0x1;
            printf("Opcode: %X\n", opcode);
        } else if (!strcmp(operation, "HLT")) {
            opcode = 0xD4400000;
            printf("Opcode: %X\n", opcode);
        // Branch 1110
        } else if (!strcmp(operation, "B")) {
            opcode = 0xEA000000;
            opcode += (o1 << 8) >> 8;
            printf("Opcode: %X\n", opcode);
        // Branch 0000
        } else if (!strcmp(operation, "BEQ")) {
            opcode = 0x0A000000;
            opcode += (o1 << 8) >> 8;
            printf("Opcode: %X\n", opcode);
        // Branch 0001
        } else if (!strcmp(operation, "BNE")) {
            opcode = 0x1A000000;
            opcode += (o1 << 8) >> 8;
            printf("Opcode: %X\n", opcode);
        //Branch 0010
        } else if (!strcmp(operation, "BHS")) {
            opcode = 0x2A000000;
            opcode += (o1 << 8) >> 8;
            printf("Opcode: %X\n", opcode);
        }
        //Branch 0011
        else if (!strcmp(operation, "BLO")) {
            opcode = 0x3A000000;
            opcode += (o1 << 8) >> 8;
            printf("Opcode: %X\n", opcode);
        }
        else {
            printf("Unknown operation: %s\n", operation);
            continue;
        }

        if (shift != 0) {
            opcode += (shift << 4);
            printf("With Shift: %X\n", opcode);
        }
        

        // Write some text to the file
        fwrite(&opcode, 4, 1, wptr);
    }




    return 0;
}