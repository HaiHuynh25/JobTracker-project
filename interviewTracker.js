// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Set today as default date
    document.getElementById('applied-date').valueAsDate = new Date();
    
    // Hide edit mode indicator initially
    document.getElementById('edit-mode-indicator').style.display = 'none';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    
   
    
    // Load applications
    loadApplications();
    updateStats();
    
    // Tab functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    // Form submission
    document.getElementById('application-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const company = document.getElementById('company').value;
        const position = document.getElementById('position').value;
        const appliedDate = document.getElementById('applied-date').value;
        const status = document.getElementById('status').value;
        const notes = document.getElementById('notes').value;
        const nextStep = document.getElementById('next-step').value;
        const editId = document.getElementById('edit-id').value;
        
        let application;
        
        if (editId) {
            // Edit existing application
            application = {
                id: parseInt(editId),
                company,
                position,
                appliedDate,
                status,
                notes,
                nextStep,
                createdAt: getOriginalCreatedAt(parseInt(editId))
            };
            
            updateApplication(application);
            showNotification(`Application for ${position} at ${company} updated successfully!`);
        } else {
            // Add new application
            application = {
                id: Date.now(),
                company,
                position,
                appliedDate,
                status,
                notes,
                nextStep,
                createdAt: new Date().toISOString()
            };
            
            saveApplication(application);
            showNotification(`Application for ${position} at ${company} added successfully!`);
        }
        
        // Reset form
        this.reset();
        document.getElementById('applied-date').valueAsDate = new Date();
        
        // Reset edit mode
        cancelEdit();
        
        // Switch to view tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('.tab[data-tab="view"]').classList.add('active');
        document.getElementById('view-tab').classList.add('active');
    });
    
    // Cancel edit button
    document.getElementById('cancel-edit-btn').addEventListener('click', cancelEdit);
    
    // Filter functionality
    document.getElementById('status-filter').addEventListener('change', loadApplications);
    document.getElementById('sort-by').addEventListener('change', loadApplications);
    document.getElementById('search').addEventListener('input', loadApplications);
    
    // Export functionality
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadApplications();
        });
    });
    
    function saveApplication(application) {
        let applications = JSON.parse(localStorage.getItem('applications')) || [];
        applications.push(application);
        localStorage.setItem('applications', JSON.stringify(applications));
        updateStats();
    }
    
    function updateApplication(updatedApp) {
        let applications = JSON.parse(localStorage.getItem('applications')) || [];
        applications = applications.map(app => 
            app.id === updatedApp.id ? updatedApp : app
        );
        localStorage.setItem('applications', JSON.stringify(applications));
        updateStats();
        loadApplications();
    }
    
    function getOriginalCreatedAt(id) {
        const applications = JSON.parse(localStorage.getItem('applications')) || [];
        const app = applications.find(a => a.id === id);
        return app ? app.createdAt : new Date().toISOString();
    }
    
    function loadApplications() {
        const status = document.getElementById('status-filter').value;
        const sortBy = document.getElementById('sort-by').value;
        const search = document.getElementById('search').value.toLowerCase();
        const viewType = document.querySelector('.view-btn.active').dataset.view;
        
        let applications = JSON.parse(localStorage.getItem('applications')) || [];
        
        // Filter
        if (status !== 'all') {
            applications = applications.filter(app => app.status === status);
        }
        
        // Search
        if (search) {
            applications = applications.filter(app => 
                app.company.toLowerCase().includes(search) || 
                app.position.toLowerCase().includes(search)
            );
        }
        
        // Sort
        if (sortBy === 'newest') {
            applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'oldest') {
            applications.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'company') {
            applications.sort((a, b) => a.company.localeCompare(b.company));
        }
        
        // Render
        const container = document.getElementById('applications-container');
        container.innerHTML = '';
        
        if (applications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No applications found</h3>
                    <p>Try changing your filters or add a new application</p>
                </div>
            `;
            return;
        }
        
        if (viewType === 'grid') {
            container.classList.remove('list-view');
            container.classList.add('grid-view');
            container.innerHTML = '<div class="applications-grid"></div>';
            const grid = container.querySelector('.applications-grid');
            
            applications.forEach(app => {
                grid.innerHTML += createApplicationCard(app);
            });
        } else {
            container.classList.remove('grid-view');
            container.classList.add('list-view');
            
            applications.forEach(app => {
                container.innerHTML += createApplicationCard(app);
            });
        }
    }
    
    function createApplicationCard(application) {
        const formattedDate = new Date(application.appliedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const statusClass = application.status.replace(/\s+/g, '-').toLowerCase();
        
        return `
            <div class="application-card" data-id="${application.id}">
                <div class="card-header">
                    <div class="card-company">${application.company}</div>
                    <div class="card-position">${application.position}</div>
                    <div class="card-status status-${statusClass}">${application.status}</div>
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                        <span><i class="far fa-clock"></i> ${new Date(application.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    ${application.notes ? `<div class="card-notes">${application.notes}</div>` : ''}
                    ${application.nextStep ? `<div style="margin-top: 15px;"><strong>Next Step:</strong> ${application.nextStep}</div>` : ''}
                </div>
                <div class="card-actions">
                    <button class="btn-outline" onclick="startEditApplication(${application.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" onclick="deleteApplication(${application.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    }
    
    function updateStats() {
        const applications = JSON.parse(localStorage.getItem('applications')) || [];
        document.getElementById('total-apps').textContent = applications.length;
        
        const activeApps = applications.filter(app => 
            app.status !== 'Rejected' && app.status !== 'Offer Received'
        ).length;
        document.getElementById('active-apps').textContent = activeApps;
        
        const interviews = applications.filter(app => 
            app.status === 'Interview Scheduled' || app.status === 'Technical Round'
        ).length;
        document.getElementById('interviews').textContent = interviews;
        
        const offers = applications.filter(app => 
            app.status === 'Offer Received'
        ).length;
        document.getElementById('offers').textContent = offers;
    }
    
    function exportData() {
        const data = localStorage.getItem('applications');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jobtrackr-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Your data has been exported successfully!');
    }
    
    function startEditApplication(id) {
        const applications = JSON.parse(localStorage.getItem('applications')) || [];
        const application = applications.find(app => app.id === id);
        
        if (application) {
            // Populate form with application data
            document.getElementById('edit-id').value = application.id;
            document.getElementById('company').value = application.company;
            document.getElementById('position').value = application.position;
            document.getElementById('applied-date').value = application.appliedDate;
            document.getElementById('status').value = application.status;
            document.getElementById('notes').value = application.notes || '';
            document.getElementById('next-step').value = application.nextStep || '';
            
            // Change form to edit mode
            document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Update Application';
            document.getElementById('cancel-edit-btn').style.display = 'inline-block';
            document.getElementById('edit-mode-indicator').style.display = 'block';
            
            // Switch to add/edit tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('.tab[data-tab="add"]').classList.add('active');
            document.getElementById('add-tab').classList.add('active');
        }
    }
    
    function cancelEdit() {
        // Reset form
        document.getElementById('application-form').reset();
        document.getElementById('applied-date').valueAsDate = new Date();
        
        // Reset edit mode
        document.getElementById('edit-id').value = '';
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-plus"></i> Add Application';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        document.getElementById('edit-mode-indicator').style.display = 'none';
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i> ${message}
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Global functions
    window.deleteApplication = function(id) {
        if (!confirm('Are you sure you want to delete this application?')) return;
        
        let applications = JSON.parse(localStorage.getItem('applications')) || [];
        applications = applications.filter(app => app.id !== id);
        localStorage.setItem('applications', JSON.stringify(applications));
        
        document.querySelector(`.application-card[data-id="${id}"]`)?.remove();
        
        // Update stats
        updateStats();
        showNotification('Application deleted successfully!');
    }
    
    window.startEditApplication = startEditApplication;
});