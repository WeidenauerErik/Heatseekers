const app = Vue.createApp({
    data() {
        return {
            temperatureChart: null,
            humidityChart: null,
            isTemperatureBarChart: false,
            isHumidityBarChart: false,
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            temperatureData: [65, 59, 80, 81, 56, 55, 40],
            humidityData: [65, 59, 80, 81, 56, 55, 40]
        };
    },
    computed: {
        temperatureChartType() {
            return this.isTemperatureBarChart ? 'bar' : 'line';
        },
        humidityChartType() {
            return this.isHumidityBarChart ? 'bar' : 'line';
        }
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
                if (this.temperatureChart) {
                    this.temperatureChart.destroy();
                }
                this.createChart(chartId, this.temperatureChartType, this.temperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
            } else {
                if (this.humidityChart) {
                    this.humidityChart.destroy();
                }
                this.createChart(chartId, this.humidityChartType, this.humidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
            }
        }
    }
});

app.mount('#app');
