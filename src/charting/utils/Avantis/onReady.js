export const onReady = (callback) => {
    setTimeout(() => {
        callback({
            supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true,
        });
    }, 0);
};
