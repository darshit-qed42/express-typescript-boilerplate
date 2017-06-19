import { Log } from '../core/log';

import * as Knex from 'knex';
import { AbstractCommand } from './lib/AbstractCommand';
const options = require('../../knexfile.ts');
const log = new Log('app:console:DatabaseResetCommand');


/**
 * DatabaseResetCommand rollback all current migrations and
 * then migrate to the latest one.
 *
 * @export
 * @class DatabaseResetCommand
 */
export class DatabaseResetCommand extends AbstractCommand {

    static command = 'db:reset';
    static description = 'Reverse all current migrations and migrate to latest.';

    public async run(): Promise<void> {
        const knex = Knex(options);

        const migrate: any = knex.migrate;

        // Force unlock in case of bad state
        await migrate.forceFreeMigrationsLock();

        // Get completed migrations
        log.info('Get completed migrations');
        const completedMigrations = await migrate._listCompleted();

        // Rollback migrations
        log.info('Rollback migrations');
        await migrate._waterfallBatch(0, completedMigrations.reverse(), 'down');

        // Migrate to latest
        log.info('Migrate to latest');
        await migrate.latest();

        // Close connection to the database
        await knex.destroy();
        log.info('Done');
    }

}


