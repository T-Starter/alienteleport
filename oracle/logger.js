const { createLogger, format, transports } = require("winston");

const isProduction = () => process.env.NODE_ENV === `production`;

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.Console({
            level: isProduction() ? `info` : `silly`
        }),
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

exports.logger = logger;