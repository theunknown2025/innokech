import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('admin@innokech.com', 'adminINOOKECH@2025');

        console.log('Checking for existing collections...');
        try {
            await pb.collections.getOne('clients');
            console.log('Collection "clients" already exists.');
        } catch (e) {
            console.log('Creating "clients" collection...');
            await pb.collections.create({
                name: 'clients',
                type: 'base',
                schema: [
                    { name: 'type', type: 'select', options: { values: ['personne_morale', 'personne_physique'] } },
                    { name: 'company_name', type: 'text' },
                    { name: 'ice', type: 'text' },
                    { name: 'company_address', type: 'text' },
                    { name: 'company_phone', type: 'text' },
                    { name: 'company_email', type: 'email' },
                    { name: 'representative_name', type: 'text' },
                    { name: 'representative_email', type: 'email' },
                    { name: 'representative_phone', type: 'text' },
                    { name: 'full_name', type: 'text' },
                    { name: 'address', type: 'text' },
                    { name: 'email', type: 'email' },
                    { name: 'phone', type: 'text' }
                ]
            });
            console.log('Collection "clients" created successfully.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
