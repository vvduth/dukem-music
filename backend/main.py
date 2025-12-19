
import modal
app = modal.App("dukem-music")

image = (
    modal.Image.debian_slim()
    .apt_install("git")
    # clone the music genration mopdel repo
    .run_commands(["git clone https://github.com/ace-step/ACE-Step.git /tmp/ACE-Step",
                   "cd /tmp/ACE-Step && pip install ."])
    .env({"HF_HOME": })
)