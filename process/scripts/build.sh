#!/bin/bash

if [[ "$(uname)" == "Linux" ]]; then
    BIN_PATH="$HOME/.luarocks/bin"
else
    BIN_PATH="/opt/homebrew/bin"
fi

# GENERATE LUA in /build-lua
mkdir -p ./build
mkdir -p ./build-lua

# build teal
cyan build -u

cd build-lua

amalg.lua -s wusdc_bridge/main.lua -o ../build/wusdc_bridge.lua \
    wusdc_bridge.utils.bint wusdc_bridge.utils.tl-utils


# FINAL RESULT is build/main.lua