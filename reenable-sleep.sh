#!/bin/bash
# Restore lid switch sleep
sudo sed -i 's/HandleLidSwitch=ignore/#HandleLidSwitch=suspend/' /etc/systemd/logind.conf
sudo sed -i 's/HandleLidSwitchExternalPower=ignore/#HandleLidSwitchExternalPower=suspend/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind

# Restore GNOME idle suspend
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'suspend'
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'suspend'

echo "Sleep behaviour restored."
