import ChartJS, { ChartData, ScriptableContext } from 'chart.js/auto';
import 'chartjs-adapter-dayjs-4';
import dayjs from 'dayjs';

import { Line } from 'react-chartjs-2';

ChartJS.register();

interface ExpenseChartProps {
  ExpenseData: { Amount: number; Date: Date }[];
}

const ExpenseChart = ({ ExpenseData }: ExpenseChartProps) => {
  const data: ChartData<'line'> = {
    datasets: [
      {
        label: 'Expense',
        data: [
          {
            x: dayjs(ExpenseData[0]?.Date)
              .subtract(1, 'day')
              .toDate() as unknown as number,
            y: 0,
          },
          ...ExpenseData.map((res) => {
            return { x: res.Date as unknown as number, y: res.Amount };
          }),
          {
            x: dayjs(ExpenseData[ExpenseData.length - 1]?.Date)
              .add(1, 'day')
              .toDate() as unknown as number,
            y: 0,
          },
        ],
        borderColor: '#ef4444',
        pointBackgroundColor: '#ef4444',
      },
    ],
  };

  return (
    <Line
      style={{ minHeight: '300px', maxHeight: '300px' }}
      data={data}
      options={{
        maintainAspectRatio: false,
        showLine: true,
        font: { style: 'normal' },
        layout: { padding: { left: 0, bottom: -8 } },
        elements: {
          point: {
            backgroundColor: '#23B89A',
            borderWidth: 0.2,
            borderColor: '#000000',
          },
          line: {
            borderWidth: 3,
            tension: 0.5,

            backgroundColor: (context: ScriptableContext<'line'>) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, 'rgba(35, 184, 154 , 0.1)');
              gradient.addColorStop(1, 'rgba(35, 184, 154 , 0)');
              return gradient;
            },
            fill: true,
          },
        },
        responsive: true,

        indexAxis: 'x',
        borderColor: '#23B89A',

        scales: {
          y: {
            border: {
              color: '#0000001A',
            },
            min: 0,
            type: 'linear',
            display: true,
            grid: {
              color: '#0000001A',
            },
            title: {
              display: true,
              text: 'Amount',
              font: { weight: 600 },
              padding: 0,
              color: '#000000',
            },
            ticks: {
              stepSize: 2,
              maxTicksLimit: 11,
              color: '#000000',
            },
          },
          x: {
            type: 'time',
            border: {
              color: '#0000001A',
            },
            grid: {
              display: false,
            },
            time: { unit: 'day' },

            title: {
              display: true,
              text: 'Days',
              align: 'center',
              font: { weight: 600 },
              color: '#000000',
            },
            ticks: {
              color: '#000000',
            },
          },
        },

        plugins: {
          legend: {
            position: 'bottom',
            align: 'start',
            fullSize: false,

            labels: {
              pointStyle: 'rect',
              padding: 10,
              usePointStyle: true,
              textAlign: 'center',
              color: '#000000',
            },
          },
        },
      }}
    />
  );
};

export default ExpenseChart;
