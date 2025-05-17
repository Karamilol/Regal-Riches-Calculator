import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RegalRichesAnalysis = () => {
  // State for RTP selection
  const [selectedRTP, setSelectedRTP] = useState(92);
  
  // State for RTP presets
  const [casinoPresets, setCasinoPresets] = useState([
    { name: 'RTP Setting: 87.49%', rtp: 87.49 },
    { name: 'RTP Setting: 90%', rtp: 90 },
    { name: 'RTP Setting: 92%', rtp: 92 },
    { name: 'RTP Setting: 94%', rtp: 94 },
    { name: 'RTP Setting: 96.27%', rtp: 96.27 }
  ]);
  
  // State for advantage thresholds - adjusted to be more conservative
  const [selectedThreshold, setSelectedThreshold] = useState('moderate');
  const thresholds = {
    conservative: { blue: 30, purple: 65, green: 85, yellow: 110 },
    moderate: { blue: 20, purple: 55, green: 75, yellow: 95 },
    aggressive: { blue: 15, purple: 45, green: 65, yellow: 85 }
  };
  
  // State for combined meter analysis
  const [yellowMeter, setYellowMeter] = useState(75);
  const [greenMeter, setGreenMeter] = useState(60);
  const [purpleMeter, setPurpleMeter] = useState(45);
  const [blueMeter, setBlueMeter] = useState(10);
  const [betSize, setBetSize] = useState(1.50);
  const [combinedEV, setCombinedEV] = useState(0);
  const [evBreakdown, setEvBreakdown] = useState([]);
  const [hourlyValue, setHourlyValue] = useState(0);
  const [advantage, setAdvantage] = useState('');
  
  // Function to calculate breakeven meter values based on RTP
  const calculateBreakeven = (rtp) => {
    // Lower RTP means higher meters needed to break even
    // These are approximations based on the mechanics
    return {
      yellow: Math.round(50 + (125-50) * (100-rtp) * 0.42),
      green: Math.round(40 + (100-40) * (100-rtp) * 0.48),
      purple: Math.round(30 + (75-30) * (100-rtp) * 0.53),
      blue: Math.round(5 + (15-5) * (100-rtp) * 0.5)
    };
  };
  
  // Function to calculate EV for Yellow meter
  const calculateYellowEV = (meterValue, rtp) => {
    const start = 50;
    const end = 125;
    const position = (meterValue - start) / (end - start);
    let probability;
    
    // Non-linear probability calculation
    if (meterValue < 80) {
      probability = position * 0.15;
    } else if (meterValue < 110) {
      probability = position * 0.40;
    } else {
      probability = position * 1.0;
    }
    
    const baseGameRTP = rtp / 100;
    const bonusValue = 0.50; // Approximate value of mega bonus as a multiple of bet
    return baseGameRTP + (probability * bonusValue) - 1;
  };
  
  // Function to calculate EV for Green meter
  const calculateGreenEV = (meterValue, rtp) => {
    const start = 40;
    const end = 100;
    const position = (meterValue - start) / (end - start);
    const probability = position * (meterValue > 80 ? 0.8 : 0.35);
    const baseGameRTP = rtp / 100;
    const bonusValue = 0.35;
    return baseGameRTP + (probability * bonusValue) - 1;
  };
  
  // Function to calculate EV for Purple meter
  const calculatePurpleEV = (meterValue, rtp) => {
    const start = 30;
    const end = 75;
    const position = (meterValue - start) / (end - start);
    const probability = position * (meterValue > 60 ? 0.7 : 0.3);
    const baseGameRTP = rtp / 100;
    const bonusValue = 0.25;
    return baseGameRTP + (probability * bonusValue) - 1;
  };
  
  // Function to calculate EV for Blue meter
  const calculateBlueEV = (meterValue, rtp) => {
    let probability;
    if (meterValue < 15) {
      probability = (meterValue - 5) / 10 * 0.3;
    } else {
      probability = 0.3; // Maxes out at 15
    }
    const baseGameRTP = rtp / 100;
    const bonusValue = 0.15;
    return baseGameRTP + (probability * bonusValue) - 1;
  };
  
  // Calculate combined EV
  useEffect(() => {
    const baseGameEV = selectedRTP / 100 - 1; // Base game EV (negative)
    
    const yellowEV = calculateYellowEV(yellowMeter, selectedRTP) - baseGameEV;
    const greenEV = calculateGreenEV(greenMeter, selectedRTP) - baseGameEV;
    const purpleEV = calculatePurpleEV(purpleMeter, selectedRTP) - baseGameEV;
    const blueEV = calculateBlueEV(blueMeter, selectedRTP) - baseGameEV;
    
    const totalEV = baseGameEV + yellowEV + greenEV + purpleEV + blueEV;
    setCombinedEV(totalEV * 100);
    
    // Hourly value calculation (600 spins per hour)
    const hourlyEV = totalEV * betSize * 600;
    setHourlyValue(hourlyEV);
    
    // Set advantage level text with more conservative thresholds
    if (totalEV > 0.05) {
      setAdvantage('Strong Advantage (>5% EV)');
    } else if (totalEV > 0.02) {
      setAdvantage('Moderate Advantage (2-5% EV)');
    } else if (totalEV > 0.01) {
      setAdvantage('Mild Advantage (1-2% EV)');
    } else if (totalEV > 0) {
      setAdvantage('Slight Advantage (0-1% EV)');
    } else {
      setAdvantage('No Advantage (Negative EV)');
    }
    
    // EV breakdown for chart
    setEvBreakdown([
      { name: 'Base Game', value: baseGameEV * 100, fill: '#d32f2f' },
      { name: 'Yellow Meter', value: yellowEV * 100, fill: '#ffc107' },
      { name: 'Green Meter', value: greenEV * 100, fill: '#4caf50' },
      { name: 'Purple Meter', value: purpleEV * 100, fill: '#9c27b0' },
      { name: 'Blue Meter', value: blueEV * 100, fill: '#2196f3' }
    ]);
  }, [yellowMeter, greenMeter, purpleMeter, blueMeter, selectedRTP, betSize]);
  
  // Apply preset thresholds
  const applyThreshold = (threshold) => {
    setSelectedThreshold(threshold);
    setBlueMeter(thresholds[threshold].blue);
    setPurpleMeter(thresholds[threshold].purple);
    setGreenMeter(thresholds[threshold].green);
    setYellowMeter(thresholds[threshold].yellow);
  };
  
  // Calculate percentage progress for each meter
  const calculateProgress = (meter, min, max) => {
    return ((meter - min) / (max - min) * 100).toFixed(1);
  };
  
  const yellowProgress = calculateProgress(yellowMeter, 50, 125);
  const greenProgress = calculateProgress(greenMeter, 40, 100);
  const purpleProgress = calculateProgress(purpleMeter, 30, 75);
  const blueProgress = calculateProgress(blueMeter, 5, 50);
  
  // Render the component
  return (
    <div className="p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-center">Regal Riches Advanced Analysis Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Combined Meter Analysis</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Casino RTP Setting:</label>
            <select 
              className="p-2 border rounded w-full"
              value={selectedRTP}
              onChange={(e) => setSelectedRTP(parseFloat(e.target.value))}
            >
              {casinoPresets.map((preset, index) => (
                <option key={index} value={preset.rtp}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Apply Threshold Preset:</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => applyThreshold('conservative')} 
                className={`px-3 py-1 rounded ${selectedThreshold === 'conservative' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Conservative
              </button>
              <button 
                onClick={() => applyThreshold('moderate')} 
                className={`px-3 py-1 rounded ${selectedThreshold === 'moderate' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Moderate
              </button>
              <button 
                onClick={() => applyThreshold('aggressive')} 
                className={`px-3 py-1 rounded ${selectedThreshold === 'aggressive' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Aggressive
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Yellow Meter (50-125): {yellowMeter} ({yellowProgress}%)</label>
            <input
              type="range"
              min="50"
              max="125"
              step="1"
              value={yellowMeter}
              onChange={(e) => setYellowMeter(parseInt(e.target.value))}
              className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>50</span>
              <span>75</span>
              <span>100</span>
              <span>125</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Green Meter (40-100): {greenMeter} ({greenProgress}%)</label>
            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={greenMeter}
              onChange={(e) => setGreenMeter(parseInt(e.target.value))}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Purple Meter (30-75): {purpleMeter} ({purpleProgress}%)</label>
            <input
              type="range"
              min="30"
              max="75"
              step="1"
              value={purpleMeter}
              onChange={(e) => setPurpleMeter(parseInt(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>30</span>
              <span>45</span>
              <span>60</span>
              <span>75</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Blue Meter (5-50): {blueMeter} ({blueProgress}%)</label>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={blueMeter}
              onChange={(e) => setBlueMeter(parseInt(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>5</span>
              <span>15</span>
              <span>30</span>
              <span>50</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Bet Size:</label>
            <select
              className="p-2 border rounded w-full"
              value={betSize}
              onChange={(e) => setBetSize(parseFloat(e.target.value))}
            >
              <option value="0.75">$0.75 (Min Bet)</option>
              <option value="1.50">$1.50</option>
              <option value="3.75">$3.75</option>
              <option value="7.50">$7.50</option>
              <option value="15.00">$15.00</option>
              <option value="37.50">$37.50</option>
            </select>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Analysis Result:</h3>
              <div className={`px-3 py-1 rounded-full text-white font-medium text-sm ${combinedEV > 5 ? 'bg-green-600' : combinedEV > 2 ? 'bg-green-500' : combinedEV > 1 ? 'bg-green-400' : combinedEV > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                {advantage}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Combined EV:</p>
                <p className={`text-2xl font-bold ${combinedEV > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {combinedEV.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Hourly Value:</p>
                <p className={`text-2xl font-bold ${hourlyValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {hourlyValue > 0 ? '+' : ''}{hourlyValue.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={evBreakdown}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'EV Contribution (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => value.toFixed(2) + '%'} />
                  <Legend />
                  <Bar dataKey="value" name="EV Contribution" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Real-World Application Guide</h2>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Observation Guidelines:</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">Watch for players who leave after extended sessions without hitting bonuses</li>
              <li className="mb-1">Check all four meters thoroughly before deciding to play</li>
              <li className="mb-1">Prioritize machines where multiple meters are elevated</li>
              <li className="mb-1">Higher denominations may have better RTP settings</li>
              <li className="mb-1">Note when diamonds/pearls land without triggering bonuses</li>
            </ul>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Decision Making Framework:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-2 border">Decision</th>
                    <th className="py-2 px-2 border">EV Range</th>
                    <th className="py-2 px-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-100">
                    <td className="py-2 px-2 border font-medium">Strong Play</td>
                    <td className="py-2 px-2 border">≥ 5% EV</td>
                    <td className="py-2 px-2 border">Play immediately at any bet</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="py-2 px-2 border font-medium">Good Play</td>
                    <td className="py-2 px-2 border">2-5% EV</td>
                    <td className="py-2 px-2 border">Play if no better opportunities</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="py-2 px-2 border font-medium">Marginal Play</td>
                    <td className="py-2 px-2 border">1-2% EV</td>
                    <td className="py-2 px-2 border">Consider only if it's crowded</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="py-2 px-2 border font-medium">No Play</td>
                    <td className="py-2 px-2 border">&lt; 1% EV</td>
                    <td className="py-2 px-2 border">Pass and find better options</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Bankroll Requirements:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-2 border">Bet Size</th>
                    <th className="py-2 px-2 border">Minimum Bankroll</th>
                    <th className="py-2 px-2 border">Recommended</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-2 border">$0.75</td>
                    <td className="py-2 px-2 border">$150</td>
                    <td className="py-2 px-2 border">$300</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 border">$1.50</td>
                    <td className="py-2 px-2 border">$300</td>
                    <td className="py-2 px-2 border">$600</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 border">$3.75</td>
                    <td className="py-2 px-2 border">$750</td>
                    <td className="py-2 px-2 border">$1,500</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 border">$7.50+</td>
                    <td className="py-2 px-2 border">$1,500</td>
                    <td className="py-2 px-2 border">$3,000+</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-medium mb-2">Model Accuracy Notes:</h3>
            <ul className="list-disc pl-5">
              <li className="mb-1">This model uses conservative approximations based on observed gameplay patterns</li>
              <li className="mb-1">Actual hit probabilities may vary from theoretical calculations</li>
              <li className="mb-1">The EV calculations get more reliable as meters approach must-hit points</li>
              <li className="mb-1">Yellow/Mega meter has the most significant impact on overall EV</li>
              <li className="mb-1">Even at positive EV, short-term results can vary dramatically</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h3 className="font-medium">Advantage Play Strategy Notes:</h3>
        <ul className="list-disc pl-5 mt-2">
          <li>Use this tool to evaluate machines you encounter by adjusting the sliders to match meter values.</li>
          <li>Even with positive EV, short-term results can be negative.</li>
          <li>Focus on RTP settings - lower RTP machines (87-90%) require significantly higher meter values to become profitable.</li>
          <li>For long-term profitability, aim for at least 2% EV to overcome volatility and opportunity costs.</li>
          <li>These calculations provide mathematical expectations, not guarantees. Slot play remains inherently volatile.</li>
          <li>MATH DOES NOT LIE, REMEMBER THAT!</li>
        </ul>
      </div>
    </div>
  );
};

export default RegalRichesAnalysis;