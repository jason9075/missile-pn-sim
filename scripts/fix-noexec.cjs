/**
 * NixOS noexec workaround: copies native binaries to /tmp before execution.
 */
const { copyFileSync, chmodSync, existsSync } = require('fs');
const { tmpdir } = require('os');
const { basename, resolve } = require('path');

const esbuildSrc = resolve(__dirname, '../node_modules/@esbuild/linux-x64/bin/esbuild');
if (existsSync(esbuildSrc)) {
  const esbuildTmp = `${tmpdir()}/esbuild.${process.pid}`;
  copyFileSync(esbuildSrc, esbuildTmp);
  chmodSync(esbuildTmp, 0o755);
  process.env.ESBUILD_BINARY_PATH = esbuildTmp;
}

const _dlopen = process.dlopen.bind(process);
process.dlopen = function (module, filename, flags) {
  if (!filename.endsWith('.node')) {
    return flags !== undefined ? _dlopen(module, filename, flags) : _dlopen(module, filename);
  }
  const tmp = `${tmpdir()}/${basename(filename)}.${process.pid}.node`;
  copyFileSync(filename, tmp);
  return flags !== undefined ? _dlopen(module, tmp, flags) : _dlopen(module, tmp);
};
