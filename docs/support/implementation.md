# Implementation Table
## MIDI Implementation Chart
<table>
	<thead>
		<tr>
			<th colspan=2>Function</th>
			<th>Recognized</th>
			<th>Remarks</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td rowspan=2>Basic Channel</td>
			<td>Default</td>
			<td>✓ 1-16</td>
			<td></td>
		</tr>
		<tr>
			<td>Changed</td>
			<td>✓ 1-16</td>
			<td>Supports up to 128 channels.</td>
		</tr>
		<tr>
			<td colspan=2>Note number</td>
			<td>0-127</td>
			<td></td>
		</tr>
		<tr>
			<td rowspan=2>Mode</td>
			<td>Default</td>
			<td>3</td>
			<td></td>
		</tr>
		<tr>
			<td>Messages</td>
			<td>✓ 3, 4</td>
			<td></td>
		</tr>
		<tr>
			<td rowspan=2>Velocity</td>
			<td>Note on</td>
			<td>✓ 9nV=1-127</td>
			<td></td>
		</tr>
		<tr>
			<td>Note off</td>
			<td>✓ 9nV=0 8n</td>
			<td></td>
		</tr>
		<tr>
			<td rowspan=2>Aftertouch</td>
			<td>Key</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>Channel</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td colspan=2>Pitchbend</td>
			<td>✓</td>
			<td>0-24 semitone steps<br/>14-bit resolution</td>
		</tr>
		<tr>
			<td rowspan=52>Control Change</td>
			<td>0</td>
			<td>✓</td>
			<td>MSB Bank Select</td>
		</tr>
		<tr>
			<td>1</td>
			<td>✓</td>
			<td>Modulation</td>
		</tr>
		<tr>
			<td>2</td>
			<td>✓</td>
			<td>Breath</td>
		</tr>
		<tr>
			<td>4</td>
			<td>✓</td>
			<td>Foot</td>
		</tr>
		<tr>
			<td>5</td>
			<td>✓</td>
			<td>Portamento Time</td>
		</tr>
		<tr>
			<td>6</td>
			<td>✓</td>
			<td>MSB (N)RPN Data Commit</td>
		</tr>
		<tr>
			<td>7</td>
			<td>✓</td>
			<td>Volume</td>
		</tr>
		<tr>
			<td>8</td>
			<td>✓</td>
			<td>Balance</td>
		</tr>
		<tr>
			<td>10</td>
			<td>✓</td>
			<td>Pan</td>
		</tr>
		<tr>
			<td>11</td>
			<td>✓</td>
			<td>Expression</td>
		</tr>
		<tr>
			<td>12</td>
			<td>✓</td>
			<td>General-purpose effect</td>
		</tr>
		<tr>
			<td>13</td>
			<td>✓</td>
			<td>General-purpose effect</td>
		</tr>
		<tr>
			<td>16</td>
			<td>✓</td>
			<td>General-purpose sound</td>
		</tr>
		<tr>
			<td>17</td>
			<td>✓</td>
			<td>General-purpose sound</td>
		</tr>
		<tr>
			<td>18</td>
			<td>✓</td>
			<td>General-purpose sound</td>
		</tr>
		<tr>
			<td>19</td>
			<td>✓</td>
			<td>General-purpose sound</td>
		</tr>
		<tr>
			<td>32</td>
			<td>✓</td>
			<td>LSB Bank Select</td>
		</tr>
		<tr>
			<td>38</td>
			<td>✓</td>
			<td>LSB (N)RPN Data Commit</td>
		</tr>
		<tr>
			<td>64</td>
			<td>✓</td>
			<td>Sustain (Hold)</td>
		</tr>
		<tr>
			<td>65</td>
			<td>✓</td>
			<td>Portamento</td>
		</tr>
		<tr>
			<td>66</td>
			<td>✓</td>
			<td>Sostenuto</td>
		</tr>
		<tr>
			<td>67</td>
			<td>✓</td>
			<td>Soft Pedal<br/><i>Store only</i></td>
		</tr>
		<tr>
			<td>68</td>
			<td>✓</td>
			<td>Legato<br/><i>Store only</i></td>
		</tr>
		<tr>
			<td>69</td>
			<td>✓</td>
			<td>Hold 2<br/><i>Store only</i></td>
		</tr>
		<tr>
			<td>70</td>
			<td>✓</td>
			<td>Timbre Variation<br/><i>Store only</i></td>
		</tr>
		<tr>
			<td>71</td>
			<td>✓</td>
			<td>Resonance</td>
		</tr>
		<tr>
			<td>72</td>
			<td>✓</td>
			<td>Release Time</td>
		</tr>
		<tr>
			<td>73</td>
			<td>✓</td>
			<td>Attack Time</td>
		</tr>
		<tr>
			<td>74</td>
			<td>✓</td>
			<td>Brightness</td>
		</tr>
		<tr>
			<td>75</td>
			<td>✓</td>
			<td>Decay Time</td>
		</tr>
		<tr>
			<td>76</td>
			<td>✓</td>
			<td>Vibrato Rate</td>
		</tr>
		<tr>
			<td>77</td>
			<td>✓</td>
			<td>Vibrato Depth</td>
		</tr>
		<tr>
			<td>78</td>
			<td>✓</td>
			<td>Vibrato Delay</td>
		</tr>
		<tr>
			<td>84</td>
			<td>✓</td>
			<td>Portamento Control</td>
		</tr>
		<tr>
			<td>91</td>
			<td>✓</td>
			<td>Reverb</td>
		</tr>
		<tr>
			<td>92</td>
			<td>✓</td>
			<td>Tremelo</td>
		</tr>
		<tr>
			<td>93</td>
			<td>✓</td>
			<td>Chorus</td>
		</tr>
		<tr>
			<td>94</td>
			<td>✓</td>
			<td>Variation</td>
		</tr>
		<tr>
			<td>95</td>
			<td>✓</td>
			<td>Phaser</td>
		</tr>
		<tr>
			<td>96</td>
			<td>✓</td>
			<td>Data Increment</td>
		</tr>
		<tr>
			<td>97</td>
			<td>✓</td>
			<td>Data Decrement</td>
		</tr>
		<tr>
			<td>98</td>
			<td>✓</td>
			<td>LSB NRPN</td>
		</tr>
		<tr>
			<td>99</td>
			<td>✓</td>
			<td>MSB NRPN</td>
		</tr>
		<tr>
			<td>100</td>
			<td>✓</td>
			<td>LSB RPN</td>
		</tr>
		<tr>
			<td>101</td>
			<td>✓</td>
			<td>MSB RPN</td>
		</tr>
		<tr>
			<td>120</td>
			<td>✕</td>
			<td>All Sound Off</td>
		</tr>
		<tr>
			<td>121</td>
			<td>✓</td>
			<td>All Controllers Reset</td>
		</tr>
		<tr>
			<td>123</td>
			<td>✓</td>
			<td>All Notes Off</td>
		</tr>
		<tr>
			<td>124</td>
			<td>✕</td>
			<td>Omni Off<br/><i>Same as cc123</i></td>
		</tr>
		<tr>
			<td>125</td>
			<td>✕</td>
			<td>Omni On<br/><i>Same as cc123</i></td>
		</tr>
		<tr>
			<td>126</td>
			<td>✓</td>
			<td>Mono</td>
		</tr>
		<tr>
			<td>127</td>
			<td>✓</td>
			<td>Poly</td>
		</tr>
		<tr>
			<td colspan=2>Program Change</td>
			<td>0-127</td>
			<td></td>
		</tr>
		<tr>
			<td rowspan=21>System Exclusive</td>
			<td>General MIDI</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>General MIDI rev. 2</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA XG</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA PLG-150AP</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA PLG-150AN</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA PLG-150DR/PC</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA PLG-150DX</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA PLG-150PF</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA PLG-100SG</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA PLG-150VL</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>YAMAHA TG300</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>Roland GS</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>Roland C/M</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>KORG NS5R</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>KORG N1R</td>
			<td>✓</td>
			<td>Redirected to NS5R</td>
		</tr>
		<tr>
			<td>KORG X5D(R)</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>KORG 05R/W</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>KAWAI GMega</td>
			<td>✓</td>
			<td>Also known as KAWAI K11</td>
		</tr>
		<tr>
			<td>AKAI SG01</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>CASIO GZ-50M</td>
			<td>✓</td>
			<td></td>
		</tr>
		<tr>
			<td>ALESIS NanoSynth</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td rowspan=3>System Common</td>
			<td>Song position</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>Song select</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>Tune</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td rowspan=4>System RealTime</td>
			<td>Clock</td>
			<td>✕</td>
			<td><i>No action defined</i></td>
		</tr>
		<tr>
			<td>Start</td>
			<td>✕</td>
			<td><i>No action defined</i></td>
		</tr>
		<tr>
			<td>Continue</td>
			<td>✕</td>
			<td><i>No action defined</i></td>
		</tr>
		<tr>
			<td>Stop</td>
			<td>✕</td>
			<td><i>No action defined</i></td>
		</tr>
		<tr>
			<td rowspan=2>Aux messages</td>
			<td>Local ON/OFF</td>
			<td>✕</td>
			<td></td>
		</tr>
		<tr>
			<td>Active Sense</td>
			<td>✕</td>
			<td><i>No action defined</i></td>
		</tr>
	</tbody>
</table>
