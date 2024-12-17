const app = Vue.createApp({
    data() {
        return {
            temperatureChart: null,
            humidityChart: null,
            isTemperatureBarChart: false,
            isHumidityBarChart: false,
            labels: [],
            temperatureData: [],
            humidityData: [],
            dataSource: '/data/raspberrydata.txt',
            isFetchingData: false,
            intervalId: null,
            showFloodWarning: false
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
    async mounted() {
        await this.fetchData();
        this.createChart('temperature', this.temperatureChartType, this.temperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
        this.createChart('humidity', this.humidityChartType, this.humidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');

        this.intervalId = setInterval(async () => {
            if (!this.isFetchingData) {
                console.log("Fetching new data...");
                this.isFetchingData = true;
                await this.fetchData();
                this.updateChart('temperature');
                this.updateChart('humidity');
                this.isFetchingData = false;
            }
        }, 5000);
    },
    methods: {
        async fetchData() {
            try {
                const response = await fetch(`/data/raspberrydata.txt?timestamp=${new Date().getTime()}`);
                const rawData = await response.text();

                const parsedData = rawData.trim().split('\n').slice(-15);
                const newLabels = [];
                const newTemperatureData = [];
                const newHumidityData = [];

                let floodStatus = 0;

                parsedData.forEach(entry => {
                    const [dateTime, temperature, humidity, flood] = entry.split('/');
                    const formattedTime = dateTime.split('-')[1].replace(/_/g, ':');
                    newLabels.push(formattedTime);
                    newTemperatureData.push(parseFloat(temperature));
                    newHumidityData.push(parseFloat(humidity));
                    floodStatus = parseInt(flood);
                });

                const lastEntry = parsedData[parsedData.length - 1];
                const [, , , flood] = lastEntry.split('/');
                this.showFloodWarning = parseInt(flood) === 1;

                console.log("Flood Warning Status:", this.showFloodWarning);

                this.labels = newLabels;
                this.temperatureData = newTemperatureData;
                this.humidityData = newHumidityData;

                const latestTemperature = newTemperatureData[newTemperatureData.length - 1];
                const latestHumidity = newHumidityData[newHumidityData.length - 1];

                if (latestTemperature > 30 || latestHumidity > 80 || floodStatus === 1) {
                    console.log("Critical values detected, sending alert...");
                    await fetch('/send-alert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            temperature: latestTemperature,
                            humidity: latestHumidity,
                            flood: floodStatus
                        })
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        },
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
                    animation: {
                        duration: 0
                    },
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
                console.log("Updating temperature chart...");
                if (this.temperatureChart) {
                    this.temperatureChart.destroy();
                }
                this.createChart('temperature', this.temperatureChartType, this.temperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
            } else {
                console.log("Updating humidity chart...");
                if (this.humidityChart) {
                    this.humidityChart.destroy();
                }
                this.createChart('humidity', this.humidityChartType, this.humidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
            }
        }
    }
});

app.mount('#app');