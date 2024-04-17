import dotenv from "dotenv";
import { pool } from "../db.js";
import util from 'util';


// http status codes
import { StatusCodes } from "http-status-codes";

import axios from 'axios';
import { STATUS_CODES } from "http";

dotenv.config();

const getConnection = util.promisify(pool.getConnection).bind(pool);
const query = util.promisify(pool.query).bind(pool);

const queryController = {};


queryController.login = async (req, res, next) => {
    const { email } = req.query;
    const LOGIN_USER = `
    SELECT *
    FROM user
    WHERE email = ?
    `;

    try {
        var result = await query(LOGIN_USER, [email]);

        // Check if the result has any records
        if (result.length > 0) {
            return res
                .status(StatusCodes.OK)
                .json(result[0]); // Return the first record if found
        } else {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json('No user found with the provided email');
        }
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json('Server error ' + err);
    }
}
queryController.AddFavourite = async (req, res, next) => {
    const { email, channel, satellite, frequency } = req.query;

    const INSERT_FAV_CHANNEL = `
        INSERT INTO user_channel_favourites
        VALUES(?, ?, ?, ?)
    `
    const values = [email, channel, satellite, frequency]

    try {
        var result = await query(INSERT_FAV_CHANNEL, values);
        return res
            .status(StatusCodes.OK)
            .json('Successfully Completed!')
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json('Server error ' + err);
    }
}

queryController.GetQueryOne = async (req, res, next) => {
    const { longitude } = req.query;
    const long = parseFloat(longitude)
    console.log(long, ", ", typeof (long))

    const GET_CHANNELS_BY_LONG = `SELECT ci.* 
    FROM channel_instance as ci
    INNER JOIN satellite as s
    ON ci.Satellite_name = s.Name
    WHERE s.Position_Long BETWEEN ? and ?`;

    const lower_bound = long - 10.0
    const upper_bound = long + 10.0
    console.log(lower_bound, ", ", upper_bound)
    // const values = [email, username, gender, birthdate, location, region, longitude];

    try {
        var result = await query(GET_CHANNELS_BY_LONG, [lower_bound, upper_bound]);
        return res
            .status(StatusCodes.OK)
            .json({ result })
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json('Server error ' + err);
    }

}

queryController.GetQueryTwo = async (req, res, next) => {
    const { email } = req.query;

    const AVAILABLE_FAVS_BY_REGION = `
    SELECT f.Channel_name as Channel, f.Satellite_name as Satellite, f.Frequency, IF(cie.Encryption IS NULL, 'Free', 'Encrypted') as Encryption
    FROM user_channel_favourites as f
    INNER JOIN user as u
        ON f.User_email = u.Email
    INNER JOIN satellite as s
        ON f.Satellite_name = s.Name
    LEFT JOIN channel_instance_encryption as cie
        ON f.Channel_name = cie.Channel_name AND f.Satellite_name = cie.Satellite_name AND f.Frequency = cie.Frequency
    WHERE u.Email = ? AND s.Region = u.region;
`;

    try {
        var result = await query(AVAILABLE_FAVS_BY_REGION, [email]);
        return res
            .status(StatusCodes.OK)
            .json({ result })
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json('Server error ' + err);
    }

}
queryController.RegisterUser = async (req, res, next) => {
    const { email, username, gender, birthdate, location, region, longitude } = req.body;
    const INSERT_USER = `INSERT INTO user(email, username, gender, birthdate, location, region, longitude) VALUES(?, ?, ?, ?, ?, ?, ?)`;
    const values = [email, username, gender, birthdate, location, region, longitude];

    try {
        await query(INSERT_USER, values);
        return res
            .status(StatusCodes.OK)
            .json('Successfully Completed!')
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json('Server error ' + err);
    }

}

queryController.GetQuerySeven = async (req, res, next) => {
    const { region, satellite, vidEncoding, language } = req.query;

    const GET_FILTERED_CHANNELS = `SELECT ci.* 
    FROM channel_instance as ci
        INNER JOIN satellite as s
        ON ci.Satellite_name = s.Name
        INNER JOIN channel_instance_language as cil
        ON ci.Channel_name = cil.Channel_name AND ci.Satellite_name = cil.Satellite_name AND ci.Frequency = cil.Frequency
    WHERE s.Region LIKE ? AND s.Name LIKE ? AND ci.Video_Encoding LIKE ? AND cil.Language LIKE ?;
    `
    // Use the query parameters to execute the SQL query
    // Assuming 'db' is your database connection
    const result = await query(GET_FILTERED_CHANNELS, [
        `%${region || ''}%`,
        `%${satellite || ''}%`,
        `%${vidEncoding || ''}%`,
        `%${language || ''}%`
    ]);
    return res
        .status(StatusCodes.OK)
        .json(result)


}

queryController.GetQuerySix = async (req, res, next) => {
    const GET_TOP_CHANNELS_LANGUAGE = `SELECT 
    Language, 
    Channel_name, 
    sat_count
    FROM 
        (
            SELECT 
                Language, 
                Channel_name, 
                sat_count,
                ROW_NUMBER() OVER(PARTITION BY Language ORDER BY sat_count DESC) as rowNum
            FROM 
                (SELECT cil.Language, cil.Channel_name, COUNT(*) as sat_count
                    FROM channel_instance_language as cil
                    WHERE cil.Language != '\r'
                    GROUP BY 1, 2
                ) 
                as t1
        ) t0
    WHERE 
    rowNum <= 5`;

    var result = await query(GET_TOP_CHANNELS_LANGUAGE)

    return res
        .status(StatusCodes.OK)
        .json(result)
}



queryController.GetQueryFive = async (req, res, next) => {
    const GET_SAT_GROWTH_RATE = `SELECT ci.Satellite_name, COUNT(*) / DATEDIFF(NOW(), s.Launch_Date) AS growth_rate
    FROM channel_instance as ci
        INNER JOIN satellite as s
        ON ci.Satellite_name = s.Name
    GROUP BY 1
    ORDER BY growth_rate DESC
    LIMIT 5`;

    var result = await query(GET_SAT_GROWTH_RATE)

    return res
        .status(StatusCodes.OK)
        .json(result)

}

queryController.GetQueryThree = async (req, res, next) => {
    const GET_TOP_PROVIDERS = `SELECT ci.Provider,  COUNT(DISTINCT ci.Channel_name) as num_of_channels, Avg(t1.num_of_sat) as avg_num_sat
    FROM channel_instance_alt as ci
    INNER JOIN (
        SELECT ci.Channel_name, COUNT(DISTINCT ci.Satellite_name) num_of_sat
        FROM channel_instance_alt as ci
        GROUP BY 1
    ) as t1 
    ON ci.Channel_name = t1.Channel_name
    WHERE Provider IS NOT NULL AND Provider LIKE '__%'
    GROUP BY 1
    ORDER BY 2 DESC, 3 DESC
    LIMIT 5;`

    var result = await query(GET_TOP_PROVIDERS)

    return res
        .status(StatusCodes.OK)
        .json(result)
}

queryController.GetQueryFour = async (req, res, next) => {
    // console.log("here")
    const GET_TOP_ROCKETS = `SELECT Launch_Rocket
        FROM satellite
        WHERE Launch_Rocket != ''
        GROUP BY 1
        ORDER BY COUNT(*) DESC
        LIMIT 5;
        `;
    var result = await query(GET_TOP_ROCKETS);

    return res
        .status(StatusCodes.OK)
        .json(result);
}

export default queryController;