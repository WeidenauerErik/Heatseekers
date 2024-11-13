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
            isFetchingData: false,  // Statusvariable, um den Abruf zu überwachen
            intervalId: null,  // Zum Speichern der Interval-ID
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
        await this.fetchData(); // Initialer Datenabruf
        this.createChart('temperature', this.temperatureChartType, this.temperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');
        this.createChart('humidity', this.humidityChartType, this.humidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');

        // Set an interval to fetch and update the data every 5 seconds (5000 ms)
        this.intervalId = setInterval(async () => {
            if (!this.isFetchingData) {
                console.log("Fetching new data...");
                this.isFetchingData = true;
                await this.fetchData();  // Fetch the latest data
                this.updateChart('temperature');  // Update the temperature chart
                this.updateChart('humidity');     // Update the humidity chart
                this.isFetchingData = false;  // Reset the fetching status after the data has been processed
            }
        }, 5000); // 5000 ms = 5 seconds
    },
    beforeUnmount() {
        clearInterval(this.intervalId);  // Clear interval when the component is destroyed
    },
    methods: {
        async fetchData() {
            try {
                console.log("Fetching data from source...");
                const response = await fetch(`/data/raspberrydata.txt?timestamp=${new Date().getTime()}`);
                const rawData = await response.text();
                console.log("Raw data fetched:", rawData);

                const parsedData = rawData.trim().split('\n').slice(-15);
                const newLabels = [];
                const newTemperatureData = [];
                const newHumidityData = [];

                parsedData.forEach(entry => {
                    const [dateTime, temperature, humidity, flood] = entry.split('/');
                    let timeOnly = dateTime.split('-')[1];  // Gets 'hour_minute_second'
                    const formattedTime = timeOnly.replace(/_/g, ':');
                    newLabels.push(formattedTime);  // Use timeOnly as labels
                    newTemperatureData.push(parseFloat(temperature));
                    newHumidityData.push(parseFloat(humidity));
                });

                console.log("Parsed Data:", newLabels, newTemperatureData, newHumidityData);
                    this.labels = newLabels;
                    this.temperatureData = newTemperatureData;
                    this.humidityData = newHumidityData;
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
                this.temperatureChart.destroy();  // Zerstören Sie das alte Diagramm
            }
            this.createChart('temperature', this.temperatureChartType, this.temperatureData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');  // Neues Diagramm erstellen
        } else {
            console.log("Updating humidity chart...");
            if (this.humidityChart) {

                this.humidityChart.destroy();  // Zerstören Sie das alte Diagramm
            }
        this.createChart('humidity', this.humidityChartType, this.humidityData, 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)');  // Neues Diagramm erstellen
        }
}
    }
});

app.mount('#app');