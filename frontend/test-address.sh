#!/bin/bash
TOKEN=$(sqlite3 ../backend/novacart.db "SELECT token FROM some_table;" 2>/dev/null) # Just need a token... wait, it's postgres!
