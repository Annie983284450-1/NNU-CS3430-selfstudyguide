# Install the tools

You will build and run a small operating system (xv6) for the RISC-V processor. Your own
computer is almost certainly an x86 or Apple-silicon machine, so we run xv6 inside an
emulator called **QEMU** and compile it with a **cross-compiler** (a compiler that runs on
your machine but produces RISC-V code). You need three things: the RISC-V compiler
(its package name differs by platform; the sections below give the exact one), the emulator
(`qemu-system-riscv64`), and, optionally, `gdb` for debugging.

You only have to do this setup **once**. Pick the section for your operating system. When
you are done, go on to [Get the code and boot xv6](../../labs/lab0/boot.md).

Everything here is free and open-source. Budget 30 to 45 minutes the first time, mostly
waiting for downloads.

## Windows (WSL2 + Ubuntu)

Windows cannot run these tools directly, but Windows 10 and 11 include **WSL2** (Windows
Subsystem for Linux), which runs a real Ubuntu Linux inside Windows. We do all lab work
inside that Ubuntu. Expect this to take 30 to 45 minutes, including one full restart of the
computer. Each step below says exactly what you should see.

**Step 1. Open PowerShell as Administrator.** Click the Start button, type `powershell`,
right-click **Windows PowerShell** in the results, and choose **Run as administrator**.
Click **Yes** on the "Do you want to allow this app to make changes" box. You get a blue (or
black) window with a prompt like `PS C:\WINDOWS\system32>`. The word **Administrator** is in
the window's title bar; if it is not, close it and open it again the right way, because the
next command fails without it.

**Step 2. Install WSL2 and Ubuntu.** In that window type:

```
wsl --install -d Ubuntu
```

and press Enter. It downloads and installs the Linux layer and Ubuntu. Wait until it prints
something like `The requested operation is successful. Changes will not be effective until the
system is rebooted.` This takes a few minutes.

**Step 3. Restart the whole computer.** "Reboot" here means the entire PC, not just the
PowerShell window: Start button, Power icon, **Restart**. Closing and reopening PowerShell
does nothing. After the restart, log back in to Windows. Usually an Ubuntu window opens by
itself and continues installing; if nothing opens within a minute, click Start, type
`Ubuntu`, and open it.

**Step 4. Create your Linux username and password.** The Ubuntu window says
`Enter new UNIX username:`. Type a short lowercase name with no spaces (for example `annie`)
and press Enter. Then it asks for a password twice. **Nothing appears on screen while you type
the password**, not even dots; that is normal, just type it and press Enter. This password is
separate from your Windows password, and you will need it every time you run `sudo` below, so
pick something you will remember. When you see a prompt like `annie@LAPTOP:~$`, you are inside
Ubuntu.

**Step 5. Check you are on WSL 2, not WSL 1.** Back in PowerShell (any PowerShell, no need for
Administrator now), run:

```
wsl -l -v
```

You should see `Ubuntu` with `VERSION` = `2`. If it says `1`, run
`wsl --set-version Ubuntu 2` and wait; QEMU does not work under WSL 1.

**Step 6. Install the tools inside Ubuntu.** In the Ubuntu window (the one with the `$`
prompt) run these two commands. The first refreshes the package list, the second installs the
compiler, the emulator, the debugger and a few helpers. The second one downloads a few hundred
megabytes and can take 5 to 10 minutes on a typical Wi-Fi connection. Type your Linux password when `sudo`
asks (again, it will not show anything while you type). The backslash `\` at the end of the
second command's first line means "continues on the next line": copy and paste both lines
together, or type it as one long line without the backslash.

```
sudo apt-get update
sudo apt-get install -y build-essential gdb-multiarch qemu-system-misc \
    gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu bc unzip
```

When it finishes, check:

```
riscv64-linux-gnu-gcc --version
qemu-system-riscv64 --version
```

Both should print a version line. If either says `command not found`, the install did not
finish; scroll up for a red error and run the `apt-get install` line again.

**Step 7. Know where your files are.** Ubuntu has its own home folder, `~` (that is
`/home/<your linux name>`). Do all lab work there, not on the Windows `C:` drive: building on
the Windows file system from Ubuntu is very slow. Your Windows files are reachable from Ubuntu
under `/mnt/c/`, so after you download a lab zip with your browser, copy it into Ubuntu like
this (replace `<WindowsName>` with your Windows user name; for this setup the zip is
`xv6-setup-student.zip`, later it is each lab's zip):

```
cd ~
cp /mnt/c/Users/<WindowsName>/Downloads/xv6-setup-student.zip .
unzip xv6-setup-student.zip
```

To open your Ubuntu folder in Windows Explorer (for example to take a screenshot of a file),
type `explorer.exe .` inside Ubuntu.

**Step 8. (Optional, recommended) Edit with VS Code.** Install VS Code on Windows, then in
VS Code install the extension called **WSL** (by Microsoft). From then on, inside Ubuntu you
can type `code .` in any folder and VS Code opens that folder with a proper Linux terminal at
the bottom.

**To come back later:** click Start, type `Ubuntu`, open it. That is your Linux terminal for
the whole semester.

**If something goes wrong:**

- `wsl --install` only prints a help page and nothing installs: your Windows is too old for
  the one-line installer. Run **Windows Update**, restart, and try again.
- An error mentioning **virtualization**, **VT-x**, **AMD-V**, or `0x80370102`: virtualization
  is turned off in your computer's firmware (BIOS/UEFI). Restart, press the key your laptop
  shows at boot (often F2, F10, Del or Esc), find a setting called Intel VT-x, AMD-V, SVM or
  "Virtualization Technology", enable it, save, and boot. Then run the `wsl --install` line
  again.
- `apt-get` fails with `Could not resolve` or `Temporary failure`: no network inside Ubuntu.
  Check that Windows itself is online, then run `wsl --shutdown` in PowerShell and open
  Ubuntu again.
- Anything else: copy the whole error message and note which step you were on. Then
  search for the message, or ask for help with both.

## macOS (Homebrew)

1. Install **Homebrew** if you don't have it (from <https://brew.sh>), then in Terminal:

   ```
   brew update
   brew install qemu
   brew tap riscv-software-src/riscv
   brew trust riscv-software-src/riscv     # <-- do NOT skip this line
   brew install riscv-tools
   ```

   **About that `brew trust` line.** Recent versions of Homebrew refuse to install from a
   third-party "tap" until you trust it, with an error like *"Refusing to load formula … from
   untrusted tap."* The fix is the `brew trust riscv-software-src/riscv` command above, which
   trusts the **whole tap** in one shot. Do not use `brew trust --formula ...` (the per-formula
   form). It only trusts one package, so `brew install` then stops on the next dependency
   (`riscv-gnu-toolchain`, `riscv-isa-sim`, and so on) and you end up playing whack-a-mole. Trust the
   tap once and you are done.

   On recent macOS (Sequoia / macOS 15 and newer) this tap ships **prebuilt binaries**, so
   `riscv-tools` installs in seconds. On **older macOS** Homebrew has no prebuilt bottle and
   builds the toolchain from source instead. That is a large download (several GB) and can
   take 30 to 60 minutes or more, so on an older Mac either be patient or use the Linux-VM fallback
   below. Either way, when it finishes the tools are named `riscv64-unknown-elf-gcc` etc.,
   and the lab Makefile detects them automatically. Verify with:

   ```
   riscv64-unknown-elf-gcc --version
   qemu-system-riscv64 --version
   ```

   Both should print a version. (Optional, for debugging later: `brew install riscv64-elf-gdb`.)

2. If `brew install riscv-tools` still fails on your macOS version for some other reason, use
   the **Linux VM fallback** below instead. It is the most reliable path on a Mac and is
   completely fine for this course.

## Linux (Ubuntu / Debian)

One command (the trailing `\` means it continues on the next line; paste both lines together):

```
sudo apt-get update
sudo apt-get install -y build-essential gdb-multiarch qemu-system-misc \
    gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu bc unzip
```

On Fedora/Arch the package names differ (`qemu-system-riscv`, `riscv64-linux-gnu-gcc`, …);
search your distribution's package manager for "riscv64" and "qemu-system-riscv".

## Fallback for anyone: a throwaway Ubuntu VM (Multipass or VirtualBox)

If your machine fights you, run a small Ubuntu virtual machine and do everything inside it.
This always works and gives everyone the same environment.

- **Multipass** (lightweight, command-line; Windows/macOS/Linux): install Multipass, then:

  ```
  multipass launch --name os --cpus 4 --disk 15G --memory 4G
  multipass shell os
  ```

  Inside the VM, run the Ubuntu `apt-get install` line above.

- **VirtualBox**: install VirtualBox, download an Ubuntu 24.04 Desktop ISO, create a VM
  (4 GB RAM, 20 GB disk), install Ubuntu, then run the Ubuntu `apt-get install` line.
