import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <span className="material-symbols-outlined text-[48px] text-red-500">error</span>
          <p className="text-red-600 mt-4 font-semibold">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}
            className="mt-4 text-indigo-600 font-semibold hover:underline">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
