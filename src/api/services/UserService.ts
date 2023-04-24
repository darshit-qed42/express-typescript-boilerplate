import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { events } from '../subscribers/events';
import { Like } from 'typeorm';

@Service()
export class UserService {
    constructor(
        @OrmRepository() private userRepository: UserRepository,
        @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
        @Logger(__filename) private log: LoggerInterface
    ) { }

    public find(): Promise<User[]> {
        this.log.info('Find all users');
        return this.userRepository.find({ relations: ['pets'] });
    }

    public findOne(id: string): Promise<User | undefined> {
        this.log.info('Find one user');
        return this.userRepository.findOne({ id });
    }

    public async create(user: User): Promise<User> {
        this.log.info('Create a new user => ', user.toString());
        user.id = uuid.v1();
        const newUser = await this.userRepository.save(user);
        this.eventDispatcher.dispatch(events.user.created, newUser);
        return newUser;
    }

    public update(id: string, user: User): Promise<User> {
        this.log.info('Update a user');
        user.id = id;
        return this.userRepository.save(user);
    }

    public async delete(id: string): Promise<void> {
        this.log.info('Delete a user');
        await this.userRepository.delete(id);
        return;
    }

/**
 * searchUser - It will return all users that match the search
 * @param {string} search - Search string to match against user's first name, last name, email, and username
 * @returns {Promise<User[]>} - Promise that resolves to an array of User objects that match the search
 */
public async searchUser(search: string): Promise<User[]> {
    try {
        this.log.info('In user search API call');
        const users = await this.userRepository.find({
            where: [
                { firstName: Like(`${search.trim()}%`) },
                { lastName: Like(`${search.trim()}%`) },
                { email: Like(`${search.trim()}%`) },
                { username: Like(`${search.trim()}%`) },
            ],
            take: 50, // Limit the number of results to 50
        });

        return users;
    } catch (error) {
            this.log.error(`Error searching for users: ${error}`);
            throw new Error('Failed to search for users.');
        }
    }
}
