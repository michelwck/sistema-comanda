export const activeTabs = [
    {
        id: 101,
        customer: 'João Silva',
        total: 156.50,
        status: 'open',
        openedAt: '03/01/2026 22:30',
        itemsList: [
            { name: 'Cerveja Long Neck', price: 15.00, quantity: 2, addedAt: '03/01/2026 22:35' },
            { name: 'Vodka Dose', price: 25.00, quantity: 1, addedAt: '03/01/2026 22:40' },
            { name: 'Energético', price: 20.00, quantity: 1, addedAt: '03/01/2026 22:40' }
        ]
    },
    {
        id: 105,
        customer: 'João Silva Santos',
        total: 156.50,
        status: 'open',
        openedAt: '03/01/2026 22:30',
        itemsList: [
            { name: 'Cerveja Long Neck', price: 15.00, quantity: 2, addedAt: '03/01/2026 22:35' },
            { name: 'Vodka Dose', price: 25.00, quantity: 1, addedAt: '03/01/2026 22:40' },
            { name: 'Energético', price: 20.00, quantity: 1, addedAt: '03/01/2026 22:40' }
        ]
    },
    {
        id: 102,
        customer: 'Maria Santos',
        total: 85.00,
        status: 'open',
        openedAt: '03/01/2026 22:45',
        itemsList: [
            { name: 'Gin Tônica', price: 35.00, quantity: 2, addedAt: '03/01/2026 22:50' },
            { name: 'Água', price: 15.00, quantity: 1, addedAt: '03/01/2026 22:55' }
        ]
    },
    {
        id: 103,
        customer: 'Carlos Oliveira',
        total: 340.00,
        status: 'open',
        openedAt: '03/01/2026 23:10',
        itemsList: [
            { name: 'Combo Vodka', price: 300.00, quantity: 1, addedAt: '03/01/2026 23:15' },
            { name: 'Energético', price: 20.00, quantity: 2, addedAt: '03/01/2026 23:15' }
        ]
    },
    {
        id: 104,
        customer: 'Ana Costa',
        total: 45.00,
        status: 'paid',
        openedAt: '03/01/2026 23:15',
        itemsList: [
            { name: 'Cerveja Artesanal', price: 45.00, quantity: 1, addedAt: '03/01/2026 23:20' }
        ]
    }
];

export const mockClients = [
    { id: 1, name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999' },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98888-8888' },
    { id: 3, name: 'Carlos Oliveira', email: 'carlos@email.com', phone: '(11) 97777-7777' },
];

export const mockProducts = [
    { id: 1, name: 'Cerveja Long Neck', price: 12.00, category: 'Cervejas' },
    { id: 2, name: 'Vodka Dose', price: 25.00, category: 'Destilados' },
    { id: 3, name: 'Gin Tônica', price: 35.00, category: 'Drinks' },
    { id: 4, name: 'Energético', price: 20.00, category: 'Não Alcoólicos' },
    { id: 5, name: 'Água', price: 10.00, category: 'Não Alcoólicos' },
    { id: 6, name: 'Cerveja Long Neck Corona', price: 12.00, category: 'Cervejas' },
];
