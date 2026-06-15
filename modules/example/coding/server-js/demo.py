# Reference: https://www.graalvm.org/latest/reference-manual/python/Interoperability
# Import Java
import java
# Access Java class
Base = java.type("com.wb.common.Base")
# Open file
file = open(Base.pathText + "wb/system/config.json", "r", encoding="UTF-8")
# Read file text
text = file.read()
# Close file
file.close()
# Return text to caller
text;