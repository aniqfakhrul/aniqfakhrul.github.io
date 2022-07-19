---
title: 🐇 AliceInWonderland
tags:
- ctf
- writeups
- web
---
| Name | Description |
| ---- | ----------- |
| AliceInWonderland     |     Welcome to Rabbit Spice Sir and Madam Please view or pricing and do contact us if you have any inquires        |

This is a web challenge that reflects the name of the challenge because it is full of rabbit holes. You can found multiple vulnerabilities in this web portal that literally leads you to nothingness. Heres the break down of what kind of vulnerabilities that I found throughout the recon process
* SQL Injection
* Possible Path Traversal (not exploitable)

### Path Traversal
Lets walk you through the process, Note that below attack is not working but the errors definitely shows in the output. I retrieved this page upon accesing the web portal.
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719092929916.png]]

Clicking on the links on the page (Pricing, Features, Contract). We can see the pages are requested directly from url using GET request. 
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719093404875.png]]
Directory bruteforce shows that we have another directory called /pages which is the abosolute path to the pricing page.
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719093532851.png]]
Hence, we assumed that index.php code will be something like this
```php
<?php
$page = $_GET['page']
include($page.'.php')
?>
```
Unfortunately, I didnt find a way to bypass this even with the null byte appended `%00`. But, heres the thing, unless the error is also hardcoded in the source code. If thats the case, then we were being trolled along the way :)) Moving on...
## SQL Injection
In the contact page section, we have a form to submit our inquiry and we have several fields which are *name, email, documents* and *message*.  Surprisingly its a working form because it made a request upon submitting. Below is the BurpSuite intercepted form submission request. 
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719094036638.png]]
Surprisingly, manually tampering the name parameter return an SQL error as shown below. 
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719094322932.png]]
Since this is an error based, we could use an updatexml function referred here from [PayloadOfAllThings](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/SQL%20Injection/MySQL%20Injection.md) repo. This is the payload i used to retrieve SQL statement output from the error. 
```sql
' or updatexml(rand(),concat(CHAR(126),version(),CHAR(126)),null) or 'test'='test-- -
```
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719094853423.png]]
### Automating Stuffs
_Note that this will create a massive traffic in the server end and cause a smelly logs in the sql logging database. Hence this is quite a bad OPSEC to proceed with in the first page_
Above steps could be automated with `sqlmap` tool. Lets throw the request to sqlmap and see available databases.
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719095401334.png]]
Unfortunately, we do not have any data in rabbit_spice database and we also doesn't have a high privilege used to write or read file onto the server. This could be checked with `user()` built-in sql function. Enumerating privileges with `--privilege` flag with `sqlmap` also shows that we only have a **USAGE** privilege.
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719095636141.png]]
So, here we go, another day another rabbit hole. Lets move on onto the next one.
## Interesting Files
I was stuck for quire a while on the previous rabbit holes and did a directory bruteforcing with `dirb` or `ffuf`. I found quite a few interesting files available on the web.
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719100104747.png]]
The interesting file found is the robots.txt file which contains a few list of directories.
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719100204236.png]]
/flag-generator.php file is also a rabbit hole after few hours spending on it. Referring to the hint given by the organizers
> Check your URL. It's long enough to get into my rabbit hole?

This got me thingking, maybe its a recursing url that could be very long as I remembered doing a challenge named Alice in Wonderland from Tryhackme also use the same tricks. Here is one of the [writeups](https://musyokaian.medium.com/wonderland-tryhackme-walkthrough-4ae729c62423) i found on the web. Lets do a recursive search with the random numbers and letters from robots.txt. We could achieve nicely formatted recursion search with `dirb` built-in features. Below is the final whole directory that we received.
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719105401287.png]]
Striping the slashes in [CyberChef](https://gchq.github.io/CyberChef/#recipe=Find_/_Replace(%7B'option':'Regex','string':'/'%7D,'',true,false,true,false)From_Hex('Auto')&input=NzkvNmYvNzUvNzIvMjAvNjYvNmMvNjEvNjcvMjAvNjkvNzMvM2EvMjAvNzcvNjUvNmMvNjMvNmYvNmQvNjUvNzQvNmYvNzIvNjEvNjIvNjIvNjkvNzQvNjgvNmYvNmMvNjUv) and convert from hex to ascii and we received the flag
![[writeup/bo1337-2022/assets/aliceinwonderland/aliceinwonderland-20220719105347568.png]]

## Reference
- https://gchq.github.io/CyberChef/
- https://portswigger.net/burp/
- https://github.com/sqlmapproject/sqlmap