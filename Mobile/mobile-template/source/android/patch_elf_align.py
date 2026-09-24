#!/usr/bin/env python3
"""16 KB page-size uyumluluğu için PT_LOAD segmentlerinin p_align alanını
4096'dan 16384'e yükseltir (ELF64 .so dosyaları). android/app/build.gradle'daki
stripReleaseDebugSymbols sonrası her .so için çağrılır.
"""
import struct
import sys

PAGE_SIZE = 0x4000  # 16 KB


def patch_elf(path):
    with open(path, "r+b") as f:
        data = bytearray(f.read())
        if data[:4] != b"\x7fELF":
            return
        if data[4] != 2:  # sadece ELF64
            return
        e_phoff = struct.unpack_from("<Q", data, 32)[0]
        e_phentsize = struct.unpack_from("<H", data, 54)[0]
        e_phnum = struct.unpack_from("<H", data, 56)[0]
        changed = False
        for i in range(e_phnum):
            off = e_phoff + i * e_phentsize
            p_type = struct.unpack_from("<I", data, off)[0]
            if p_type == 1:  # PT_LOAD
                p_align = struct.unpack_from("<Q", data, off + 48)[0]
                if p_align < PAGE_SIZE:
                    struct.pack_into("<Q", data, off + 48, PAGE_SIZE)
                    changed = True
        if changed:
            f.seek(0)
            f.write(data)


if __name__ == "__main__":
    patch_elf(sys.argv[1])
