---
title: Simplify
tags:
- writeups
- ctf
- re
---

| Name     | Description     |
| -------- | --------------- |
| Simplify | Jst gosstan me, |

We were given a file named `crackme` and upon executing the file, we require to enter a correct code to receive the flag
![[writeup/bo1337-2022/assets/simplify/simplify-20220719160636433.png]]

Lets dissasemble the code with this awesome online site [DogBolt.org](https://dogbolt.org). 
![[writeup/bo1337-2022/assets/simplify/simplify-20220719160849912.png]]

Now we can see a piece of code that verify our code.
![[writeup/bo1337-2022/assets/simplify/simplify-20220719160933705.png]]

We have to do a bit of calculation to get into the if block. Here are the unknowns that need to be solved.
```
3 * v7 + v4 == 18044
3 * v6 * v5 == 5174190
v4 == 1010
v7 + 49363 * v6 == 63683948
```
After doing the maths, the values that we have now are
```
v4 = 1010

# v7 
3 * v7 = 18044 - v4 / 3
v7 = 5678

# v6
v7 + 49363 * v6 = 63683948
5678 + 49363 * v6 = 63683948
49363 * v6 = 63678270
v6 = 63678270 / 49363
v6 = 1290

# v5
3 * 1290 * v5 = 5174190
3870 * v5 = 5174190
v5 = 5174190 / 3870
v5 = 1337
```

Enter the correct code and we successfully retrieve the flag
![[writeup/bo1337-2022/assets/simplify/simplify-20220719162804620.png]]

