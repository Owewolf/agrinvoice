import React from 'react';

interface MiniBarChartProps {
  data: Array<{ label: string; value: number; secondaryValue?: number }>;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  showLabels?: boolean;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  height = 100,
  primaryColor = '#3b82f6',
  secondaryColor = '#10b981',
  showLabels = true
}) => {
  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.secondaryValue || 0)));
  const barWidth = `${80 / data.length}%`;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between" style={{ height: `${height}px` }}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center" style={{ width: barWidth }}>
            <div className="flex items-end space-x-1 w-full justify-center">
              <div
                className="bg-blue-500 rounded-t-sm transition-all hover:opacity-80"
                style={{
                  height: `${(item.value / maxValue) * (height - 20)}px`,
                  width: item.secondaryValue !== undefined ? '45%' : '60%',
                  backgroundColor: primaryColor,
                  minHeight: item.value > 0 ? '2px' : '0px'
                }}
                title={`${item.label}: ${item.value}`}
              />
              {item.secondaryValue !== undefined && (
                <div
                  className="bg-green-500 rounded-t-sm transition-all hover:opacity-80"
                  style={{
                    height: `${(item.secondaryValue / maxValue) * (height - 20)}px`,
                    width: '45%',
                    backgroundColor: secondaryColor,
                    minHeight: item.secondaryValue > 0 ? '2px' : '0px'
                  }}
                  title={`${item.label}: ${item.secondaryValue}`}
                />
              )}
            </div>
            {showLabels && (
              <div className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface MiniLineChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export const MiniLineChart: React.FC<MiniLineChartProps> = ({
  data,
  height = 60,
  color = '#3b82f6',
  showDots = true
}) => {
  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <svg width="100%" height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {showDots && data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((item.value - minValue) / range) * 100;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill={color}
              className="hover:r-4 transition-all"
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
};

export const TrendIndicator: React.FC<{ value: number; label: string; previousValue?: number }> = ({
  value,
  label,
  previousValue
}) => {
  let trend = 'stable';
  let trendColor = 'text-gray-500';
  let trendIcon = '→';

  if (previousValue !== undefined) {
    if (value > previousValue) {
      trend = 'up';
      trendColor = 'text-green-600';
      trendIcon = '↗';
    } else if (value < previousValue) {
      trend = 'down';
      trendColor = 'text-red-600';
      trendIcon = '↘';
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-2xl font-bold">{value}</span>
      <div className="flex flex-col">
        <span className="text-sm text-gray-600">{label}</span>
        {previousValue !== undefined && (
          <span className={`text-xs ${trendColor} flex items-center`}>
            <span className="mr-1">{trendIcon}</span>
            {Math.abs(((value - previousValue) / previousValue) * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};