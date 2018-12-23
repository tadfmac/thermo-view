/*
 * AMG8833 MIDI
 */
#include <Wire.h>
#include <MIDI.h>
#include <Adafruit_AMG88xx.h>

Adafruit_AMG88xx amg;

MIDI_CREATE_DEFAULT_INSTANCE();

float pixels[AMG88xx_PIXEL_ARRAY_SIZE];

void setup() {
  bool status;
  status = amg.begin(0x68);
  if (!status) {
    while (1);
  }
  delay(100);
  MIDI.begin(16);
}

void loop() { 
  uint8_t vel;

  amg.readPixels(pixels);
  for(int cnt=0; cnt<AMG88xx_PIXEL_ARRAY_SIZE; cnt++){
    vel = (uint8_t)((pixels[cnt] * 2.0)+0.5);
    MIDI.sendNoteOn(cnt,vel,16);
    delay(2);
  }
}

