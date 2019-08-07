#!/bin/bash
cd lib
sed -i 's/Object\.defineProperty(exports, "__esModule", { value: true });/ /g' core.js duplex.js helpers.js