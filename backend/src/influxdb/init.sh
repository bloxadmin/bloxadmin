#!/bin/bash
set -e

# Create the influx bucket "game-aggregation"
influx bucket create -n game-aggregation -r 90d
