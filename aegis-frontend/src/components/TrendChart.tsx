import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  data: number[];
  title?: string;
}

export function TrendChart({ data, title }: TrendChartProps) {
  const chartData = data.map((value, index) => ({
    month: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index],
    value,
  }));

  const getColor = (value: number) => {
    if (value <= 40) return '#2EB8A9';
    if (value <= 60) return '#7BC96F';
    if (value <= 80) return '#F4B400';
    return '#E63946';
  };

  // Get average for color
  const avgValue = data.reduce((a, b) => a + b, 0) / data.length;
  const lineColor = getColor(avgValue);

  return (
    <div>
      {title && <h3 className="text-sm text-gray-700 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            stroke="#E5E7EB"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            stroke="#E5E7EB"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#374151' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
