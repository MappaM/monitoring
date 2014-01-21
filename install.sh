#!/bin/sh

if [ -e /bin/yum ]; then
        i="sudo yum install"
else
	i="sudo apt-get install"
fi

echo "Installing python-psutil"
$i python-psutil
