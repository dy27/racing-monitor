import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const Header = styled.h3`
  color: #343a40;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  padding: 15px;
  border-bottom: 2px solid #dee2e6;
  text-align: left;
  color: #495057;
`;

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
`;

const ChartContainer = styled.div`
  margin-top: 20px;
`;

const OddsTable = ({ odds }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current && chartRef.current.chartInstance) {
      chartRef.current.chartInstance.destroy();
    }

    const chartData = {
      labels: odds.map((horse) => horse.name),
      datasets: [
        {
          label: 'Odds',
          data: odds.map((horse) => horse.odds),
        },
      ],
    };

    const chartOptions = {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    const newChart = new Chart(chartRef.current, {
      type: 'bar',
      data: chartData,
      options: chartOptions,
    });

    chartRef.current = newChart;

    return () => {
      if (newChart) {
        newChart.destroy();
      }
    };
  }, [odds]);

  return (
    <DashboardContainer>
      <Header>Trading Dashboard</Header>
      <Table>
        <thead>
          <tr>
            <TableHeader>Horse</TableHeader>
            <TableHeader>Odds</TableHeader>
          </tr>
        </thead>
        <tbody>
          {odds.map((horse) => (
            <tr key={horse.id}>
              <TableCell>{horse.name}</TableCell>
              <TableCell>{horse.odds}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
      <ChartContainer>
        <canvas ref={chartRef}></canvas>
      </ChartContainer>
    </DashboardContainer>
  );
};

export default OddsTable;
