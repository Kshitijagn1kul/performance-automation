import random
from json import JSONDecodeError  # Corrected import
from locust import HttpUser, task, between

# --- Configuration ---
# It's better to pass the host via the command line: --host=http://14.99.126.171
# We define it here for clarity, but it will be overridden by the command line.
HOST = "http://14.99.126.171"

# --- User Pools ---
# Consider using a more secure method for credentials in production tests.
EMPLOYEES = [{"usr": "emp95@erp.in", "pwd": "Agnikul_1"}]
PL_USERS = [{"usr": "emp54@erp.in", "pwd": "Agnikul_1"}]
FL_USERS = [{"usr": "emp50@erp.in", "pwd": "Agnikul_1"}]


class ERPUser(HttpUser):
    """
    Base class for all ERP users.
    Handles login and stores user-specific information.
    """
    wait_time = between(1, 3)  # Simulates realistic user think time
    host = HOST

    # Each subclass will define its own user_pool
    abstract = True

    def on_start(self):
        """
        Called when a virtual user is started.
        Logs in the user and stores credentials.
        """
        # Pick a random user from the pool defined in the subclass
        creds = random.choice(self.user_pool)
        self.user_email = creds["usr"]

        print(f"User {self.user_email} starting...")

        # Use catch_response=True to manually mark the request as success or failure
        with self.client.post(
            "/api/method/login",
            json=creds,
            catch_response=True,
            name="/api/method/login" # Explicit name for cleaner reporting
        ) as resp:
            try:
                if resp.status_code == 200 and resp.json().get("message") == "Logged In":
                    resp.success()
                    print(f"User {self.user_email} logged in successfully.")
                else:
                    # Mark as failure and provide a reason
                    resp.failure(f"Login failed. Status: {resp.status_code}, Body: {resp.text}")
                    # Stop the user if login fails, as all subsequent tasks will fail anyway
                    self.environment.runner.stop_user(self)
            except JSONDecodeError:
                resp.failure(f"Login failed. Could not decode JSON response. Body: {resp.text}")
                self.environment.runner.stop_user(self)

    def _get_random_pending_request(self):
        """
        Helper method to fetch a list of pending requests and return a random one.
        This prevents race conditions from multiple users approving the same request.
        """
        with self.client.get(
            "/api/method/payroll_management.api.request_approvals",
            catch_response=True,
            name="/api/method/payroll_management.api.request_approvals (for pending request)"
        ) as resp:
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    # Assuming the API returns a list of requests under a 'message' or 'data' key
                    # Adjust the key based on your actual API response structure
                    pending_requests = data.get("message", [])
                    if pending_requests:
                        # Assuming each request is a dict with a 'name' field
                        request_names = [req.get('name') for req in pending_requests if req.get('name')]
                        if request_names:
                            return random.choice(request_names)
                except (JSONDecodeError, KeyError) as e:
                    resp.failure(f"Failed to parse pending requests: {e}")
                    return None
            else:
                resp.failure(f"Failed to get pending requests. Status: {resp.status_code}")
                return None
        return None


class EmployeeUser(ERPUser):
    """
    Simulates an Employee user.
    """
    user_pool = EMPLOYEES
    weight = 3 # Give this user class a higher chance of being spawned

    @task(2)
    def create_travel_request(self):
        payload = {
            "req_for": "Project",
            "req_name": f"P1-Test-{random.randint(100, 999)}",
            "age": "27",
            "phone_number": "7823450987",
            "aadhaar_attachment": "http://14.99.126.171/payroll_desk",
            "accommodation": 0,
            "travel": 1,
            "t_data": {
                "from_location": "Taramani",
                "to_location": "Perungudi",
                "from_date": "24-09-2025",
                "mode": "Train"
            }
        }
        with self.client.post(
            "/api/method/payroll_management.api.create_travel_accommodation_requests",
            json=payload,
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to create travel request. Status: {resp.status_code}, Body: {resp.text}")

    @task(1)
    def track_self_requests(self):
        with self.client.get(
            "/api/method/payroll_management.api.track_requests?request_type=Self&from_date=&to_date=&page_size=1000",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to track self requests. Status: {resp.status_code}")

    @task(1)
    def leave_tracker(self):
        # Use the logged-in user's email dynamically
        params = {"request": "Self", "year": "2025", "user": self.user_email, "page_size": "1000"}
        with self.client.get(
            "/api/method/payroll_management.api.get_leave_tracker_details",
            params=params,
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to get leave tracker. Status: {resp.status_code}")

    @task(1)
    def export_reimbursements(self):
        with self.client.get(
            "/api/method/payroll_management.api.export_reimbursements",
            catch_response=True
        ) as resp:
            # Export endpoints might return a file or a 200 OK. Adjust as needed.
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to export reimbursements. Status: {resp.status_code}")


class PLUser(ERPUser):
    """
    Simulates a Project Lead user.
    """
    user_pool = PL_USERS
    weight = 2

    @task(2)
    def team_track_requests(self):
        with self.client.get(
            "/api/method/payroll_management.api.track_requests?request_type=Team&from_date=&to_date=&page_size=1000",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to track team requests. Status: {resp.status_code}")

    @task(1)
    def request_approvals(self):
        with self.client.get(
            "/api/method/payroll_management.api.request_approvals",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed to get request approvals list. Status: {resp.status_code}")

    @task(3) # Higher weight as this is a key PL action
    def approve_request(self):
        """
        Dynamically fetches a pending request and approves it.
        This is more realistic than using a hardcoded ID.
        """
        record_to_approve = self._get_random_pending_request()

        if record_to_approve:
            params = {
                "record": record_to_approve,
                "status": "Approve",
                "reason": "Approved via load test",
                "assign_to": ""
            }
            with self.client.get(
                "/api/method/payroll_management.api.approve_request",
                params=params,
                catch_response=True,
                name=f"/api/method/payroll_management.api.approve_request [{record_to_approve}]"
            ) as resp:
                if resp.status_code == 200:
                    resp.success()
                else:
                    resp.failure(f"Failed to approve {record_to_approve}. Status: {resp.status_code}, Body: {resp.text}")
        else:
            # No pending requests to approve, which is a valid state.
            # We can log this or simply do nothing. Locust will just wait for the next task.
            print("No pending requests found to approve.")


class FLUser(ERPUser):
    """
    Simulates a Functional Lead user.
    """
    user_pool = FL_USERS
    weight = 1

    @task(3)
    def view_request_details(self):
        """
        Dynamically fetches a request to view details for.
        Reuses the helper method from PLUser for simplicity.
        """
        # NOTE: You might need a different endpoint to get a list of *viewable* requests
        # rather than just *pending* ones. For this example, we'll reuse the pending list.
        record_to_view = self._get_random_pending_request()

        if record_to_view:
            params = {"doctype": "PR_Reimbursement_Requests", "name": record_to_view}
            with self.client.get(
                "/api/method/payroll_management.api.view_details",
                params=params,
                catch_response=True,
                name=f"/api/method/payroll_management.api.view_details [{record_to_view}]"
            ) as resp:
                if resp.status_code == 200:
                    resp.success()
                else:
                    resp.failure(f"Failed to view details for {record_to_view}. Status: {resp.status_code}")
        else:
            print("No requests found to view.")
