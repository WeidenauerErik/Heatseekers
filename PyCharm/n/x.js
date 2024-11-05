const app = Vue.createApp({
        data() {
            return {
                temperatureChart: null,
                humidityChart: null,
                temperatureChartType: 'line',
                humidityChartType: 'line',
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                temperatureData: [65, 59, 80, 811, 56, 55, 340],
                humidityData: [65, 59, 80, 81, 56, 55, 40]
            };
        },
        mounted() {
            this.createChart('temperature', this.temperatureChartType, this.temperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
            this.createChart('humidity', this.humidityChartType, this.humidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
        },
        methods: {
            createChart(chartId, type, data, backgroundColor, borderColor) {
                const ctx = document.getElementById(chartId).getContext('2d');
                const chart = new Chart(ctx, {
                    type: type,
                    data: {
                        labels: this.labels,
                        datasets: [{
                            label: chartId.charAt(0).toUpperCase() + chartId.slice(1),
                            data: data,
                            backgroundColor: backgroundColor,
                            borderColor: borderColor,
                            fill: false,
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                if (chartId === 'temperature') {
                    this.temperatureChart = chart;
                } else {
                    this.humidityChart = chart;
                }
            },
            updateChart(chartId) {
                if (chartId === 'temperature') {
                    this.temperatureChart.destroy();
                    this.createChart(chartId, this.temperatureChartType, this.temperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
                } else {
                    this.humidityChart.destroy();
                    this.createChart(chartId, this.humidityChartType, this.humidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
                }
            }
        }
    });

    app.mount('#app');